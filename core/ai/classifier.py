"""
Zero-shot classification wrapper.

Calls the mDeBERTa pipeline with the Spanish hypotheses defined in `taxonomy.py`,
collects top-k labels with scores and applies per-category thresholds.

A small set of post-classification heuristic rules corrects predictable
confusions when the message text contains strong domain signals (DAF, "en el día
de ayer", "mantenimiento programado", "restablecimiento del bloque", etc.).
These rules run after the model and can override low-confidence predictions or
disambiguate semantically similar categories.

If the top-1 score is below the global threshold, falls back to `general_info`
with `low_confidence=True` so downstream code can deprioritize it.
"""

from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any

from core.ai.taxonomy import (
    CATEGORIES,
    CATEGORIES_BY_ID,
    DEFAULT_CONFIDENCE_THRESHOLD,
    get_hypotheses,
)

logger = logging.getLogger(__name__)


# Max characters fed to the classifier. UNE messages are short (median ~300
# chars). Truncating to 800 keeps virtually all real content while halving
# attention cost vs. the original 1500.
_MAX_CHARS = 800


def _normalize(text: str) -> str:
    norm = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in norm if unicodedata.category(c) != "Mn")


# ---------- Strong-signal regex patterns for heuristic overrides ---------- #

_RE_DAF = re.compile(
    r"\b(daf|disparad[oa]\s+autom[aá]tic[oa]\s+por\s+frecuencia)\b",
    re.IGNORECASE,
)
_RE_SEN_FAILURE = re.compile(
    r"desconexi[oó]n\s+(?:total\s+)?d[eo]l?\s+sistema\s+electroenerg[eé]tico\s+nacional",
    re.IGNORECASE,
)
_RE_SEN_RECOVERY = re.compile(
    r"(?:restablec|recuperaci[oó]n|sincroniz)\w*\s+d[eo]l?\s+(?:sen|sistema\s+electroenerg[eé]tico)",
    re.IGNORECASE,
)
_RE_SEN_PERCENT = re.compile(
    r"(?:restablec|sincroniz|recuperaci[oó]n)\w*[\s\S]{0,80}\b\d{1,3}\s*%",
    re.IGNORECASE,
)
_RE_DAILY_RESUME = re.compile(
    r"\b(?:en\s+el\s+d[ií]a\s+de\s+ayer|durante\s+la\s+jornada\s+de\s+ayer|jornada\s+anterior|reporte\s+del\s+d[ií]a\s+de\s+ayer)\b",
    re.IGNORECASE,
)
_RE_DAILY_FORECAST = re.compile(
    r"\b(?:para\s+(?:el\s+d[ií]a\s+de\s+)?hoy|pron[oó]stico\s+(?:operativo\s+)?(?:para\s+)?(?:el\s+d[ií]a\s+)?(?:de\s+)?hoy|estimaci[oó]n\s+para\s+hoy)\b",
    re.IGNORECASE,
)
_RE_BLOCK_RECOVERY = re.compile(
    r"(?:restablec|recuperaci[oó]n|recuperad)\w*[\s\S]{0,60}\bbloque(?:s)?\b",
    re.IGNORECASE,
)
_RE_BLOCK_AFFECTATION = re.compile(
    r"\bbloque(?:s)?\b[\s\S]{0,60}(?:afect|fuera|d[eé]ficit|salida)",
    re.IGNORECASE,
)
_RE_BLOCK_AFFECTATION_REV = re.compile(
    r"(?:afect|fuera|d[eé]ficit|salida)[\s\S]{0,60}\bbloque(?:s)?\b",
    re.IGNORECASE,
)
_RE_SCHEDULED_MAINT = re.compile(
    r"\b(?:mantenimiento\s+(?:programad[oa]|planificad[oa])|trabajos?\s+(?:programad[oa]s?|planificad[oa]s?))\b",
    re.IGNORECASE,
)
_RE_WEATHER = re.compile(
    r"\b(?:descargas?\s+el[eé]ctricas?|fuertes?\s+vientos?|lluvias?\s+(?:intensas?|fuertes?)|tormenta|cicl[oó]n|hurac[aá]n|tornado)\b",
    re.IGNORECASE,
)
_RE_THERMAL_UNIT = re.compile(
    r"\b(?:CTE\s+|unidad\s+(?:n[oº]\.?\s*)?\d+\s+de\s+(?:la\s+)?(?:CTE\s+)?)?(?:antonio\s+guiteras|guiteras|felton|lidio\s+ram[oó]n|nuevitas|cespedes|c[eé]spedes|rent[eé]|antonio\s+maceo|m[aá]ximo\s+g[oó]mez|mariel|tallapiedra|otto\s+parellada|che\s+guevara|cienfuegos)\b",
    re.IGNORECASE,
)
_RE_THERMAL_VERBS = re.compile(
    r"\b(?:sali[oó]\s+de\s+servicio|sincronizaci[oó]n|sincroniz[oó]|entr[oó]\s+en\s+l[ií]nea|fuera\s+de\s+servicio\s+por\s+aver[ií]a|aport(?:a|ando)\s+\d+\s*MW)\b",
    re.IGNORECASE,
)
_RE_CIRCUIT_FAILURE = re.compile(
    r"\b(?:disparo\s+del?\s+circuito|aver[ií]a\s+(?:primaria|secundaria)|transformador(?:es)?\s+(?:da[ñn]ad[oa]s?|fundid[oa]s?)|circuito\s+[A-Z]?-?\d+)\b",
    re.IGNORECASE,
)
_RE_APOLOGY = re.compile(
    r"\b(?:lamentamos|disculpa(?:s|mos)?|agradecemos\s+la\s+comprensi[oó]n|pedimos\s+disculpas|nuestras?\s+excusas)\b",
    re.IGNORECASE,
)
# Zone recovery requires a recovery verb + a zone term, with NO block reference.
_RE_RECOVERY_VERB = re.compile(
    r"\b(?:restablec|recuperaci[oó]n|recuperad|normaliz|sincroniz)\w*\b",
    re.IGNORECASE,
)
_RE_ZONE_TERM = re.compile(
    r"\b(?:municipio|reparto|consejo\s+popular|zona|distrito|comunidad)\b",
    re.IGNORECASE,
)
_RE_BLOCK_TERM = re.compile(r"\bbloque(?:s)?\b", re.IGNORECASE)


# ----- FAST-PATH: strong, mutually-exclusive regex matches that determine the
# category with high certainty. When one of these triggers we can skip the
# zero-shot classifier entirely (which is the slow part of the pipeline,
# ~15 forward passes per message). The classifier is kept as fallback for
# anything ambiguous.

# Domain terms that should appear in any operationally-relevant UNE message.
# Texts without any of these almost always belong to general_info / institutional.
# Plurals + verb conjugations are handled with `\w*` suffixes where the stem is
# unambiguous.
_DOMAIN_TERMS = re.compile(
    r"\b(?:bloques?|circuitos?|servicio\s+el[eé]ctric[oa]s?|electricidad|corriente|"
    r"sistema\s+electroenerg[eé]tico|sistema\s+el[eé]ctrico\s+nacional|sen\b|"
    r"disparo\w*|disparad[oa]\s+autom[aá]tic[oa]|aver[ií]a\w*|transformador\w*|"
    r"subestaci[oó]n\w*|generaci[oó]n|demanda|disponibilidad|d[eé]ficit|"
    r"afectaci[oó]n\w*|afect\w*|restablec\w*|recuperac\w*|recuperad\w*|mantenimiento\w*|"
    r"fuera\s+de\s+servicio|horario\s+pico|cte\s+|termoel[eé]ctrica\w*|sincroniz\w*|"
    r"daf\b|\d+\s*mw\b|mw\b|sali[oó]\s+de\s+servicio|entr[oó]\s+en\s+l[ií]nea|"
    r"fall[oa]\w*|apag[oó]n\w*|descargas?\s+el[eé]ctricas?|fuertes?\s+vientos?|"
    r"tormenta\w*|cicl[oó]n\w*|hurac[aá]n\w*|en\s+el\s+d[ií]a\s+de\s+ayer|"
    r"pron[oó]stico|reparto\w*|consejo\s+popular|municipios?)\b",
    re.IGNORECASE,
)


def has_domain_signal(text: str) -> bool:
    """True if the message contains at least one term from the electrical-grid domain."""
    return bool(_DOMAIN_TERMS.search(text)) if text else False


def fast_path_category(text: str) -> tuple[str, float] | None:
    """
    Returns (category_id, confidence) when the text contains an unambiguous
    domain marker, else None.
    """
    if not text:
        return None

    # Negative fast-path: no domain term at all → general institutional info.
    if not _DOMAIN_TERMS.search(text):
        return ("general_info", 0.7)

    if _RE_DAF.search(text):
        return ("daf", 0.95)

    has_sen_failure = bool(_RE_SEN_FAILURE.search(text))
    has_sen_recovery = bool(_RE_SEN_RECOVERY.search(text)) or bool(_RE_SEN_PERCENT.search(text))

    if has_sen_failure and not has_sen_recovery:
        return ("sen_failure", 0.95)
    if has_sen_recovery and not has_sen_failure:
        return ("sen_recovery", 0.85)

    has_daily_resume = bool(_RE_DAILY_RESUME.search(text))
    has_daily_forecast = bool(_RE_DAILY_FORECAST.search(text))
    if has_daily_resume and not has_daily_forecast:
        return ("daily_resume", 0.9)
    if has_daily_forecast and not has_daily_resume:
        return ("daily_forecast", 0.85)

    if _RE_SCHEDULED_MAINT.search(text):
        return ("scheduled_maintenance", 0.9)

    has_block_recovery = bool(_RE_BLOCK_RECOVERY.search(text))
    has_block_affectation = bool(
        _RE_BLOCK_AFFECTATION.search(text) or _RE_BLOCK_AFFECTATION_REV.search(text)
    )
    if has_block_recovery and not has_block_affectation:
        return ("block_recovery", 0.85)
    if has_block_affectation and not has_block_recovery:
        return ("block_affectation", 0.85)

    if _RE_CIRCUIT_FAILURE.search(text):
        return ("circuit_failure", 0.85)

    # Thermal unit mention + state verb: skip classifier.
    if _RE_THERMAL_UNIT.search(text) and _RE_THERMAL_VERBS.search(text):
        return ("thermal_unit_status", 0.8)

    # Pure apology with no operational marker.
    if _RE_APOLOGY.search(text):
        ops_signals = (
            _RE_DAF.search(text)
            or _RE_SEN_FAILURE.search(text)
            or _RE_SEN_RECOVERY.search(text)
            or _RE_BLOCK_RECOVERY.search(text)
            or _RE_BLOCK_AFFECTATION.search(text)
            or _RE_CIRCUIT_FAILURE.search(text)
        )
        if not ops_signals:
            return ("apology_communication", 0.75)

    if _RE_WEATHER.search(text):
        return ("weather_impact", 0.8)

    return None


def _apply_heuristics(text: str, top1_id: str, top1_score: float, pairs: list[tuple[str, float]]) -> tuple[str, float, str | None]:
    """
    Returns (final_category, final_confidence, override_reason).
    `override_reason` is None when the model's top-1 stands.
    """
    # Highest-priority deterministic overrides — rare but unambiguous.
    if _RE_DAF.search(text):
        # DAF acronym is unique to this category in UNE messages.
        return ("daf", max(top1_score, 0.9), "regex:daf")

    if _RE_SEN_FAILURE.search(text):
        return ("sen_failure", max(top1_score, 0.9), "regex:sen_failure")

    if _RE_SEN_RECOVERY.search(text) or _RE_SEN_PERCENT.search(text):
        # Only override if model picked something unrelated to recovery.
        if top1_id not in {"sen_recovery", "block_recovery", "zone_recovery"}:
            return ("sen_recovery", max(top1_score, 0.7), "regex:sen_recovery")

    if _RE_DAILY_RESUME.search(text):
        return ("daily_resume", max(top1_score, 0.85), "regex:daily_resume")

    if _RE_DAILY_FORECAST.search(text) and not _RE_DAILY_RESUME.search(text):
        return ("daily_forecast", max(top1_score, 0.8), "regex:daily_forecast")

    if _RE_SCHEDULED_MAINT.search(text):
        return ("scheduled_maintenance", max(top1_score, 0.85), "regex:scheduled_maintenance")

    if _RE_WEATHER.search(text):
        # Only override if model didn't already lean weather.
        if top1_id not in {"weather_impact"}:
            return ("weather_impact", max(top1_score, 0.7), "regex:weather_impact")

    # Circuit failure: "disparo del circuito", "avería primaria", "transformadores dañados".
    if _RE_CIRCUIT_FAILURE.search(text) and not _RE_SEN_FAILURE.search(text):
        if top1_id not in {"circuit_failure", "thermal_unit_status"}:
            return ("circuit_failure", max(top1_score, 0.8), "regex:circuit_failure")

    # Block-specific disambiguation: "restablecimiento del bloque X" must beat sen_recovery / daily_resume / etc.
    if _RE_BLOCK_RECOVERY.search(text) and not _RE_SEN_FAILURE.search(text):
        if top1_id not in {"block_recovery", "sen_failure"}:
            return ("block_recovery", max(top1_score, 0.75), "regex:block_recovery")

    if (_RE_BLOCK_AFFECTATION.search(text) or _RE_BLOCK_AFFECTATION_REV.search(text)) and not _RE_SEN_FAILURE.search(text):
        if top1_id not in {"block_affectation", "block_recovery", "sen_failure", "sen_recovery", "daf"}:
            return ("block_affectation", max(top1_score, 0.75), "regex:block_affectation")

    # Zone recovery: recovery verb + zone term + NO block reference.
    if (
        _RE_RECOVERY_VERB.search(text)
        and _RE_ZONE_TERM.search(text)
        and not _RE_BLOCK_TERM.search(text)
        and not _RE_SEN_FAILURE.search(text)
    ):
        if top1_id in {"block_recovery"}:
            return ("zone_recovery", max(top1_score, 0.75), "regex:zone_recovery")

    # Thermal unit named + state verb (override even when classifier picked daf).
    if _RE_THERMAL_UNIT.search(text) and _RE_THERMAL_VERBS.search(text):
        if top1_id not in {"thermal_unit_status", "sen_failure", "sen_recovery"}:
            return ("thermal_unit_status", max(top1_score, 0.75), "regex:thermal_unit")

    # Pure apology / institutional communication. Run last so it doesn't shadow real events.
    if _RE_APOLOGY.search(text):
        # Only apply if no operational event signals were already detected upstream.
        ops_signals = (
            _RE_DAF.search(text)
            or _RE_SEN_FAILURE.search(text)
            or _RE_SEN_RECOVERY.search(text)
            or _RE_BLOCK_RECOVERY.search(text)
            or _RE_BLOCK_AFFECTATION.search(text)
            or _RE_CIRCUIT_FAILURE.search(text)
            or _RE_DAILY_RESUME.search(text)
            or _RE_DAILY_FORECAST.search(text)
        )
        if not ops_signals and top1_id not in {"apology_communication"}:
            return ("apology_communication", max(top1_score, 0.7), "regex:apology")

    return (top1_id, top1_score, None)


@dataclass
class CategoryHit:
    id: str
    label: str
    score: float


@dataclass
class CategoryResult:
    category: str
    confidence: float
    subcategories: list[dict[str, Any]] = field(default_factory=list)
    low_confidence: bool = False


def _truncate(text: str) -> str:
    if len(text) <= _MAX_CHARS:
        return text
    return text[:_MAX_CHARS]


def classify(text: str, classifier=None) -> CategoryResult:
    """
    Classify a single message. If `classifier` is None, the singleton is loaded.
    Strong-signal regex matches short-circuit the model entirely.
    """
    text = (text or "").strip()
    if not text:
        return CategoryResult(category="general_info", confidence=0.0, low_confidence=True)

    # Fast-path: skip the model if the text contains an unambiguous marker.
    fp = fast_path_category(text)
    if fp is not None:
        cid, conf = fp
        label = CATEGORIES_BY_ID[cid].label if cid in CATEGORIES_BY_ID else cid
        return CategoryResult(
            category=cid,
            confidence=conf,
            subcategories=[{"id": cid, "label": label, "score": round(conf, 4)}],
            low_confidence=False,
        )

    if classifier is None:
        from core.ai.models import get_zero_shot_classifier

        classifier = get_zero_shot_classifier()

    hypotheses = get_hypotheses()
    truncated = _truncate(text)

    raw = classifier(
        truncated,
        candidate_labels=hypotheses,
        multi_label=True,
    )

    # `raw['labels']` and `raw['scores']` are aligned. Map back to category ids.
    labels = raw.get("labels", [])
    scores = raw.get("scores", [])

    hyp_to_id = {c.hypothesis_es: c.id for c in CATEGORIES}

    pairs = []
    for label, score in zip(labels, scores):
        cid = hyp_to_id.get(label)
        if cid is None:
            continue
        pairs.append((cid, float(score)))

    if not pairs:
        return CategoryResult(category="general_info", confidence=0.0, low_confidence=True)

    pairs.sort(key=lambda p: p[1], reverse=True)
    top_id, top_score = pairs[0]
    cat_obj = CATEGORIES_BY_ID.get(top_id)
    threshold = cat_obj.threshold if cat_obj else DEFAULT_CONFIDENCE_THRESHOLD

    subcategories = [
        {"id": cid, "label": CATEGORIES_BY_ID[cid].label, "score": round(score, 4)}
        for cid, score in pairs[:3]
    ]

    # Apply heuristic post-classification rules to correct predictable confusions.
    final_id, final_score, override_reason = _apply_heuristics(text, top_id, top_score, pairs)

    if override_reason:
        # Re-rank subcategories so the heuristic winner shows up first.
        final_label = CATEGORIES_BY_ID[final_id].label if final_id in CATEGORIES_BY_ID else final_id
        subcategories = [{"id": final_id, "label": final_label, "score": round(final_score, 4)}] + [
            s for s in subcategories if s["id"] != final_id
        ][:2]
        return CategoryResult(
            category=final_id,
            confidence=final_score,
            subcategories=subcategories,
            low_confidence=False,
        )

    if top_score < threshold:
        return CategoryResult(
            category="general_info",
            confidence=top_score,
            subcategories=subcategories,
            low_confidence=True,
        )

    return CategoryResult(
        category=top_id,
        confidence=top_score,
        subcategories=subcategories,
        low_confidence=False,
    )
