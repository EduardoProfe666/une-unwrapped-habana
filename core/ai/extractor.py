"""
Entity / metadata extraction layer.

Combines:
- BETO NER (LOC/ORG/MISC entities) — surfaces names not in our gazetteer.
- Gazetteer matching for canonical Cuban geography and thermal infrastructure.
- Regex extractors for MW, time mentions, blocks (affected vs recovered) and SEN status.

The output feeds `processor.process_message`, which adds severity and event_type.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from core.ai import gazetteer
from core.ai.regex_extractors import extract_all

logger = logging.getLogger(__name__)


@dataclass
class ExtractionResult:
    affected_blocks: list[int] = field(default_factory=list)
    recovered_blocks: list[int] = field(default_factory=list)
    affected_provinces: list[str] = field(default_factory=list)
    affected_municipalities: list[str] = field(default_factory=list)
    mentioned_circuits: list[str] = field(default_factory=list)
    mentioned_units: list[dict[str, Any]] = field(default_factory=list)
    power_demand_mw: int | None = None
    power_availability_mw: int | None = None
    power_deficit_mw: int | None = None
    peak_forecast_mw: int | None = None
    mentioned_times: list[dict[str, str]] = field(default_factory=list)
    sen_status: str = "unknown"
    ner_entities: list[dict[str, Any]] = field(default_factory=list)
    unmatched_locs: list[str] = field(default_factory=list)


def _run_ner(text: str, ner_model=None) -> list[dict[str, Any]]:
    """Run NER and return normalized entity dicts. Empty list on failure."""
    if not text.strip():
        return []
    if ner_model is None:
        from core.ai.models import get_ner_pipeline

        ner_model = get_ner_pipeline()
    try:
        # NER pipelines may choke on very long inputs; truncate defensively.
        snippet = text[:1500]
        raw = ner_model(snippet)
    except Exception as exc:  # noqa: BLE001
        logger.warning("[ai.extractor] NER failed: %s", exc)
        return []

    entities = []
    for r in raw:
        entities.append(
            {
                "word": (r.get("word") or "").strip(),
                "entity_group": r.get("entity_group") or r.get("entity") or "",
                "score": float(r.get("score", 0.0)),
                "start": int(r.get("start", 0) or 0),
                "end": int(r.get("end", 0) or 0),
            }
        )
    return entities


def extract(text: str, ner_model=None) -> ExtractionResult:
    """
    Run all extractors over `text` and assemble an ExtractionResult.

    `ner_model` is passed in to avoid loading singletons in unit tests; in
    production it can be omitted.
    """
    result = ExtractionResult()
    if not text or not text.strip():
        return result

    # Regex pass (fast, deterministic).
    regex_out = extract_all(text)
    result.affected_blocks = regex_out["affected_blocks"]
    result.recovered_blocks = regex_out["recovered_blocks"]
    power = regex_out["power"]
    result.power_demand_mw = power.get("power_demand_mw")
    result.power_availability_mw = power.get("power_availability_mw")
    result.power_deficit_mw = power.get("power_deficit_mw")
    result.peak_forecast_mw = power.get("peak_forecast_mw")
    result.mentioned_times = regex_out["times"]
    result.sen_status = regex_out["sen_status"]

    # Gazetteer pass (canonical names).
    result.affected_provinces = gazetteer.match_provinces(text)
    result.affected_municipalities = gazetteer.match_municipalities(text)
    result.mentioned_circuits = gazetteer.match_circuits(text)
    result.mentioned_units = gazetteer.match_thermal_units(text)

    # NER pass (catch toponyms not in catalog).
    entities = _run_ner(text, ner_model=ner_model)
    result.ner_entities = entities

    matched_canonicals = set(
        result.affected_provinces
        + result.affected_municipalities
        + result.mentioned_circuits
        + [u.get("canonical", "") for u in result.mentioned_units]
    )
    text_norm = gazetteer.normalize_text(text)
    for ent in entities:
        if ent["entity_group"] not in {"LOC", "ORG", "MISC"}:
            continue
        word_norm = gazetteer.normalize_text(ent["word"])
        if not word_norm:
            continue
        if any(gazetteer.normalize_text(c).find(word_norm) != -1 for c in matched_canonicals):
            continue
        if word_norm in text_norm and word_norm not in result.unmatched_locs:
            result.unmatched_locs.append(word_norm)

    return result
