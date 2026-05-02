"""
Orchestrator that turns a single TelegramMessage into a `MessageAIAnalysis`.

Pipeline:
    1. classifier (zero-shot mDeBERTa) → category + subcategories
    2. extractor (NER + regex + gazetteer) → metadata
    3. severity derivation (from category + magnitudes)
    4. event_type derivation (mapping table)
    5. summary template (per category)

Resilience: any exception inside step 1 or 2 is caught at the message level —
the message gets a fallback `general_info` analysis with `ai_failed=True` and
the error stored in `ai_error` so downstream pipelines never break.
"""

from __future__ import annotations

import logging
import sqlite3
import time
from datetime import datetime, timezone
from typing import Any

from core.ai import db as ai_db
from core.ai.classifier import classify
from core.ai.extractor import extract
from core.ai.taxonomy import CATEGORY_TO_EVENT_TYPE
from core.classes import MessageAIAnalysis

logger = logging.getLogger(__name__)


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# -------------------- SEVERITY DERIVATION -------------------- #


def _derive_severity(category: str, ext, has_multiple_zones: bool) -> str:
    if category == "sen_failure":
        return "critical"
    if category == "sen_recovery":
        return "high"

    deficit = ext.power_deficit_mw or 0

    if deficit >= 1500:
        return "critical"
    if deficit >= 800:
        return "high"

    if category in {"daf", "block_affectation", "circuit_failure", "zone_outage"}:
        return "high" if has_multiple_zones or len(ext.affected_blocks) >= 3 else "medium"

    if category in {"block_recovery", "zone_recovery", "daily_resume"}:
        return "low"

    if category in {"thermal_unit_status", "scheduled_maintenance", "weather_impact"}:
        return "medium"

    if category in {"daily_forecast", "apology_communication"}:
        return "low"

    return "medium"


# -------------------- SUMMARY TEMPLATES (no LLM) -------------------- #


def _format_blocks(blocks: list[int]) -> str:
    if not blocks:
        return ""
    if len(blocks) == 1:
        return f"bloque {blocks[0]}"
    return f"bloques {', '.join(str(b) for b in blocks)}"


def _format_zones(provinces: list[str], municipalities: list[str], circuits: list[str]) -> str:
    parts: list[str] = []
    if municipalities:
        parts.append(", ".join(municipalities[:3]))
    elif provinces:
        parts.append(", ".join(provinces[:3]))
    if circuits and not municipalities:
        parts.append(", ".join(circuits[:3]))
    return " — ".join(parts)


def _build_summary(category: str, ext) -> str:
    blocks_aff = _format_blocks(ext.affected_blocks)
    blocks_rec = _format_blocks(ext.recovered_blocks)
    zones = _format_zones(
        ext.affected_provinces, ext.affected_municipalities, ext.mentioned_circuits
    )
    deficit = ext.power_deficit_mw
    demand = ext.power_demand_mw
    avail = ext.power_availability_mw

    if category == "sen_failure":
        bits = ["Desconexión total del SEN"]
        if deficit:
            bits.append(f"déficit {deficit} MW")
        return " — ".join(bits)
    if category == "sen_recovery":
        return "Restablecimiento del SEN en curso"
    if category == "block_affectation":
        bits = []
        if blocks_aff:
            bits.append(f"Afectación {blocks_aff}")
        if zones:
            bits.append(zones)
        if deficit:
            bits.append(f"déficit {deficit} MW")
        return " — ".join(bits) or "Afectación de bloque"
    if category == "block_recovery":
        return "Restablecimiento " + (blocks_rec or "de bloque")
    if category == "circuit_failure":
        return "Falla de circuito" + (f" en {zones}" if zones else "")
    if category == "zone_outage":
        return "Afectación zonal" + (f" — {zones}" if zones else "")
    if category == "zone_recovery":
        return "Recuperación zonal" + (f" — {zones}" if zones else "")
    if category == "daily_resume":
        bits = ["Resumen del día anterior"]
        if demand:
            bits.append(f"demanda {demand} MW")
        if avail:
            bits.append(f"disponibilidad {avail} MW")
        return " — ".join(bits)
    if category == "daily_forecast":
        bits = ["Pronóstico del día"]
        if deficit:
            bits.append(f"déficit estimado {deficit} MW")
        return " — ".join(bits)
    if category == "daf":
        return "Disparado Automático por Frecuencia"
    if category == "thermal_unit_status":
        units = ", ".join(u.get("canonical", "") for u in ext.mentioned_units[:3])
        return "Estado de unidad termoeléctrica" + (f" — {units}" if units else "")
    if category == "scheduled_maintenance":
        return "Mantenimiento programado" + (f" — {zones}" if zones else "")
    if category == "weather_impact":
        return "Impacto meteorológico" + (f" — {zones}" if zones else "")
    if category == "apology_communication":
        return "Comunicación / disculpa institucional"
    return "Información general"


# -------------------- MESSAGE PROCESSING -------------------- #


def process_message(
    message_id: int,
    text: str,
    *,
    classifier_pipeline=None,
    ner_pipeline=None,
    model_version: str | None = None,
) -> MessageAIAnalysis:
    """Run the full AI pipeline for one message. Returns a `MessageAIAnalysis`."""
    from core.ai import MODEL_VERSION

    mv = model_version or MODEL_VERSION
    now_iso = _utcnow_iso()

    try:
        text = (text or "").strip()
        if not text:
            return MessageAIAnalysis(
                message_id=message_id,
                category="general_info",
                category_confidence=0.0,
                summary="",
                model_version=mv,
                ai_failed=False,
                processed_at=now_iso,
            )

        cat = classify(text, classifier=classifier_pipeline)
        ext = extract(text, ner_model=ner_pipeline)

        has_multiple_zones = (
            len(ext.affected_provinces) >= 2
            or len(ext.affected_municipalities) >= 2
        )
        severity = _derive_severity(cat.category, ext, has_multiple_zones)
        event_type = CATEGORY_TO_EVENT_TYPE.get(cat.category, "other")
        summary = _build_summary(cat.category, ext)

        raw_features = {
            "low_confidence": cat.low_confidence,
            "ner_count": len(ext.ner_entities),
            "unmatched_locs": ext.unmatched_locs,
        }

        return MessageAIAnalysis(
            message_id=message_id,
            category=cat.category,
            category_confidence=round(cat.confidence, 4),
            subcategories=cat.subcategories,
            sen_status=ext.sen_status,
            affected_blocks=ext.affected_blocks,
            recovered_blocks=ext.recovered_blocks,
            affected_provinces=ext.affected_provinces,
            affected_municipalities=ext.affected_municipalities,
            mentioned_circuits=ext.mentioned_circuits,
            mentioned_units=ext.mentioned_units,
            power_demand_mw=ext.power_demand_mw,
            power_availability_mw=ext.power_availability_mw,
            power_deficit_mw=ext.power_deficit_mw,
            peak_forecast_mw=ext.peak_forecast_mw,
            mentioned_times=ext.mentioned_times,
            severity=severity,
            event_type=event_type,
            summary=summary,
            raw_features=raw_features,
            model_version=mv,
            ai_failed=False,
            ai_error=None,
            processed_at=now_iso,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("[ai.processor] Failed on message_id=%s", message_id)
        return MessageAIAnalysis(
            message_id=message_id,
            category="general_info",
            category_confidence=0.0,
            summary="",
            model_version=mv,
            ai_failed=True,
            ai_error=f"{exc.__class__.__name__}: {exc}",
            processed_at=now_iso,
        )


def process_batch(
    messages: list[dict],
    *,
    classifier_pipeline=None,
    ner_pipeline=None,
    model_version: str | None = None,
) -> list[MessageAIAnalysis]:
    """Process a list of message dicts (id, text). Captures exceptions per message."""
    out: list[MessageAIAnalysis] = []
    for m in messages:
        out.append(
            process_message(
                m["id"],
                m.get("text") or "",
                classifier_pipeline=classifier_pipeline,
                ner_pipeline=ner_pipeline,
                model_version=model_version,
            )
        )
    return out


# -------------------- INCREMENTAL ENTRY POINT -------------------- #


def process_pending_ai_analysis(
    batch_size: int = 64,
    max_messages: int | None = None,
    year_filter: int | None = None,
) -> dict[str, Any]:
    """
    Process all messages that don't yet have an analysis (or have one for an old
    `model_version`). Commits to the DB every batch for resumability.

    Returns a dict with stats: {processed, failed, skipped, elapsed_s}.
    """
    from core.ai import MODEL_VERSION
    from core.ai.models import get_ner_pipeline, get_zero_shot_classifier

    started = time.time()
    conn = sqlite3.connect("telegram_messages.db")
    try:
        ai_db.setup_ai_table(conn)

        total_pending = ai_db.get_pending_message_ids(
            conn, MODEL_VERSION, limit=max_messages, year=year_filter
        )
        if not total_pending:
            logger.info("[ai.processor] No pending messages.")
            return {"processed": 0, "failed": 0, "skipped": 0, "elapsed_s": 0.0}

        logger.info(
            "[ai.processor] %d messages pending (year=%s, max=%s).",
            len(total_pending),
            year_filter,
            max_messages,
        )

        # Eager-load models once.
        classifier_pipeline = get_zero_shot_classifier()
        ner_pipeline = get_ner_pipeline()

        processed = 0
        failed = 0

        # Adaptive batch shrink under memory pressure.
        try:
            import psutil  # type: ignore

            has_psutil = True
        except ImportError:
            has_psutil = False

        i = 0
        while i < len(total_pending):
            current_batch = batch_size
            if has_psutil:
                try:
                    if psutil.virtual_memory().percent > 85:
                        current_batch = max(8, batch_size // 4)
                        logger.warning(
                            "[ai.processor] High memory usage; shrinking batch to %d",
                            current_batch,
                        )
                except Exception:  # noqa: BLE001
                    pass

            batch_ids = total_pending[i : i + current_batch]
            i += current_batch
            messages = ai_db.fetch_messages_for_ai(conn, batch_ids)

            analyses = process_batch(
                messages,
                classifier_pipeline=classifier_pipeline,
                ner_pipeline=ner_pipeline,
                model_version=MODEL_VERSION,
            )

            ai_db.save_ai_analyses(conn, analyses)

            processed += sum(1 for a in analyses if not a.ai_failed)
            failed += sum(1 for a in analyses if a.ai_failed)

            logger.info(
                "[ai.processor] Progress: %d/%d (failed=%d, elapsed=%.1fs)",
                min(i, len(total_pending)),
                len(total_pending),
                failed,
                time.time() - started,
            )

        elapsed = time.time() - started
        logger.info(
            "[ai.processor] Done. processed=%d failed=%d elapsed=%.1fs",
            processed,
            failed,
            elapsed,
        )
        return {
            "processed": processed,
            "failed": failed,
            "skipped": 0,
            "elapsed_s": round(elapsed, 1),
        }
    finally:
        conn.close()
