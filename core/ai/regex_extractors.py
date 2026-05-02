"""
Deterministic regex-based extractors for the UNE message domain.

These run in addition to the NER model. They are fast, predictable and capture
structured numbers/times that NER models tend to miss in domain-specific text.
"""

from __future__ import annotations

import re
from typing import Any

# ---------------------- POWER METRICS (MW) ---------------------- #

# Captures a number followed by MW. Optional thousands separators and decimals.
# Examples matched: "1234 MW", "1234MW", "1.234 mw", "1,234 MW"
_NUMBER_MW = re.compile(
    r"(?P<num>\d{1,2}(?:[\.,]\d{3})*(?:[\.,]\d+)?|\d+)\s*(?P<unit>mw|m\s*w)\b",
    re.IGNORECASE,
)

# Context windows: prefix and suffix patterns to label the MW number.
_CONTEXT_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("deficit", re.compile(r"(d[eé]ficit|afectaci[oó]n)", re.IGNORECASE)),
    ("availability", re.compile(r"(disponibilidad|disponibles?|generaci[oó]n)", re.IGNORECASE)),
    ("demand", re.compile(r"(demanda|consumo)", re.IGNORECASE)),
    ("peak_forecast", re.compile(r"(m[aá]xima|pico|hora pico|horario pico)", re.IGNORECASE)),
]

_CONTEXT_WINDOW = 60  # chars before & after the MW number


def _to_int_mw(num_str: str) -> int | None:
    """Parses '1.234' / '1,234' / '1234' / '1234.5' as MW (rounded int)."""
    s = num_str.strip()
    if not s:
        return None
    # Heuristic: if both '.' and ',' present, comma is decimal, dot is thousands.
    if "." in s and "," in s:
        s = s.replace(".", "").replace(",", ".")
    elif s.count(",") == 1 and len(s.split(",")[1]) <= 2:
        s = s.replace(",", ".")
    elif "," in s:
        s = s.replace(",", "")
    elif s.count(".") > 1:
        s = s.replace(".", "")
    elif "." in s and len(s.split(".")[1]) == 3:
        # "1.234" → 1234 (thousands)
        s = s.replace(".", "")
    try:
        return round(float(s))
    except (ValueError, TypeError):
        return None


def extract_power_metrics(text: str) -> dict[str, int | None]:
    """
    Extracts demand_mw, availability_mw, deficit_mw, peak_forecast_mw.
    Each label takes the closest matched number; if multiple, prefers the largest
    plausible value (UNE often reports rolling figures).
    """
    out: dict[str, list[int]] = {
        "demand": [],
        "availability": [],
        "deficit": [],
        "peak_forecast": [],
    }
    for m in _NUMBER_MW.finditer(text):
        num = _to_int_mw(m.group("num"))
        if num is None or num <= 0 or num > 10000:
            # Sanity: real Cuban grid is ~3000 MW peak. Discard absurd values.
            continue
        start, end = m.span()
        window_start = max(0, start - _CONTEXT_WINDOW)
        window_end = min(len(text), end + _CONTEXT_WINDOW)
        ctx = text[window_start:window_end]
        labels: list[str] = []
        for label, pat in _CONTEXT_PATTERNS:
            if pat.search(ctx):
                labels.append(label)
        if not labels:
            continue
        # If "deficit" and "demand" both match, prefer the closer keyword.
        labels = sorted(
            labels,
            key=lambda lab: _closest_distance(text, start, end, lab),
        )
        out[labels[0]].append(num)

    def _pick(values: list[int]) -> int | None:
        if not values:
            return None
        return max(values)

    return {
        "power_demand_mw": _pick(out["demand"]),
        "power_availability_mw": _pick(out["availability"]),
        "power_deficit_mw": _pick(out["deficit"]),
        "peak_forecast_mw": _pick(out["peak_forecast"]),
    }


def _closest_distance(text: str, start: int, end: int, label: str) -> int:
    pat = dict(_CONTEXT_PATTERNS).get(label)
    if pat is None:
        return 9999
    best = 9999
    for m in pat.finditer(text):
        d = min(abs(m.start() - end), abs(start - m.end()))
        if d < best:
            best = d
    return best


# ---------------------- TIME MENTIONS ---------------------- #

# Range: "10:00 a 14:00", "de 18:00 a 22:00", "entre las 11:00 y 15:00"
_TIME_RANGE = re.compile(
    r"(?:de\s+las?\s+|entre\s+las?\s+)?"
    r"(?P<start_h>\d{1,2})(?::(?P<start_m>\d{2}))?\s*(?P<start_ampm>am|pm|hrs?|h)?"
    r"\s*(?:a|hasta|y)\s*(?:las?\s+)?"
    r"(?P<end_h>\d{1,2})(?::(?P<end_m>\d{2}))?\s*(?P<end_ampm>am|pm|hrs?|h)?",
    re.IGNORECASE,
)

# Single time: "10:00", "10:30 am", "a las 18:00"
_TIME_SINGLE = re.compile(
    r"(?:a\s+las?\s+|sobre\s+las?\s+)?"
    r"(?P<h>\d{1,2})(?::(?P<m>\d{2}))?\s*(?P<ampm>am|pm|hrs?|h)\b",
    re.IGNORECASE,
)


def _normalize_time(h: str, m: str | None, ampm: str | None) -> str | None:
    try:
        hour = int(h)
        minute = int(m) if m else 0
    except (ValueError, TypeError):
        return None
    if ampm:
        ampm_lower = ampm.lower()
        if ampm_lower == "pm" and hour < 12:
            hour += 12
        elif ampm_lower == "am" and hour == 12:
            hour = 0
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        return None
    return f"{hour:02d}:{minute:02d}"


def extract_time_mentions(text: str) -> list[dict[str, str]]:
    """
    Returns list of {start, end?, raw}.

    Ranges captured first; remaining single times are added if they don't overlap.
    """
    mentions: list[dict[str, str]] = []
    consumed_spans: list[tuple[int, int]] = []

    for m in _TIME_RANGE.finditer(text):
        start_t = _normalize_time(m.group("start_h"), m.group("start_m"), m.group("start_ampm") or m.group("end_ampm"))
        end_t = _normalize_time(m.group("end_h"), m.group("end_m"), m.group("end_ampm"))
        if start_t and end_t:
            mentions.append({"start": start_t, "end": end_t, "raw": m.group(0).strip()})
            consumed_spans.append(m.span())

    for m in _TIME_SINGLE.finditer(text):
        s, e = m.span()
        if any(cs <= s and e <= ce for cs, ce in consumed_spans):
            continue
        t = _normalize_time(m.group("h"), m.group("m"), m.group("ampm"))
        if t:
            mentions.append({"start": t, "end": "", "raw": m.group(0).strip()})

    # Dedup
    seen = set()
    unique = []
    for ment in mentions:
        key = (ment.get("start"), ment.get("end"))
        if key in seen:
            continue
        seen.add(key)
        unique.append(ment)
    return unique


# ---------------------- BLOCK PARSING ---------------------- #

_BLOCK_LIST_PATTERN = re.compile(
    r"bloques?(?:\s*(?:no\.?|n[uú]meros?))?[:\s]*"
    r"(?P<list>(?:[1-6](?:\s*(?:,|y|/|\s)\s*)?){1,6})",
    re.IGNORECASE,
)
_BLOCK_NUMBERS = re.compile(r"[1-6]")

_BLOCK_INLINE = re.compile(
    r"\bbloque(?:\s*no\.?)?\s*(?P<num>[1-6])\b",
    re.IGNORECASE,
)


def parse_block_list(text: str) -> list[int]:
    """Extract all bloques mentioned (1-6) from any list-like construct or inline mention."""
    found: set[int] = set()

    for match in _BLOCK_LIST_PATTERN.finditer(text):
        for n in _BLOCK_NUMBERS.findall(match.group("list")):
            found.add(int(n))

    for match in _BLOCK_INLINE.finditer(text):
        found.add(int(match.group("num")))

    return sorted(found)


_AFFECT_VERBS = re.compile(
    r"(afect|d[eé]ficit|fuera|sale|salir|salieron|cae|cay[oó]|interrum|desconect)",
    re.IGNORECASE,
)
_RECOVER_VERBS = re.compile(
    r"(restablec|recuper|normaliz|cierra|cerr[oó]|conecta|conect[oó]|sincroniz)",
    re.IGNORECASE,
)


def parse_recovery_context(text: str, blocks: list[int]) -> tuple[list[int], list[int]]:
    """
    Returns (affected_blocks, recovered_blocks). Looks at proximity to action verbs.
    If no verb is found, defaults to "affected" (UNE messages skew toward affectations).
    """
    if not blocks:
        return [], []

    affected: list[int] = []
    recovered: list[int] = []

    text_lower = text.lower()

    for block in blocks:
        # Find nearest verb to any mention of this block.
        block_pat = re.compile(rf"\bbloque(?:s)?(?:\s*no\.?)?\s*[^.]*?\b{block}\b", re.IGNORECASE)
        is_recovered = False
        is_affected = False

        for m in block_pat.finditer(text_lower):
            window_start = max(0, m.start() - 80)
            window_end = min(len(text_lower), m.end() + 80)
            ctx = text_lower[window_start:window_end]
            if _RECOVER_VERBS.search(ctx):
                is_recovered = True
            if _AFFECT_VERBS.search(ctx):
                is_affected = True

        # Resolution: explicit recovery wins; otherwise default to affected.
        if is_recovered and not is_affected:
            recovered.append(block)
        elif is_affected and not is_recovered:
            affected.append(block)
        elif is_recovered and is_affected:
            # Both verbs in the same window → probably an announcement of timeline.
            # Lean on global signal: if the message overall has more "restablec" hits.
            n_recover = len(_RECOVER_VERBS.findall(text_lower))
            n_affect = len(_AFFECT_VERBS.findall(text_lower))
            if n_recover > n_affect:
                recovered.append(block)
            else:
                affected.append(block)
        else:
            affected.append(block)

    return sorted(set(affected)), sorted(set(recovered))


# ---------------------- SEN STATUS ---------------------- #

_SEN_FAILURE_PATTERN = re.compile(
    r"desconexi[oó]n\s+(?:total\s+)?d[eo]l?\s+sistema\s+electroenerg[eé]tico\s+nacional",
    re.IGNORECASE,
)
_SEN_RECOVERY_FULL_PATTERN = re.compile(
    r"100\s*%\b.*?(?:restablec|recuperaci[oó]n|sincroniz)|(?:restablec|recuper).*?100\s*%",
    re.IGNORECASE | re.DOTALL,
)
_SEN_RECOVERY_PARTIAL_PATTERN = re.compile(
    r"(?:restablec|recuperaci[oó]n).*?\b\d{1,3}\s*%",
    re.IGNORECASE | re.DOTALL,
)


def detect_sen_status(text: str) -> str:
    """Returns one of: active_failure | recovering | normal | unknown."""
    if _SEN_FAILURE_PATTERN.search(text):
        return "active_failure"
    if _SEN_RECOVERY_FULL_PATTERN.search(text):
        return "normal"
    if _SEN_RECOVERY_PARTIAL_PATTERN.search(text):
        return "recovering"
    return "unknown"


def extract_all(text: str) -> dict[str, Any]:
    """Convenience wrapper that runs all extractors in one call."""
    blocks = parse_block_list(text)
    affected, recovered = parse_recovery_context(text, blocks)
    return {
        "blocks_all": blocks,
        "affected_blocks": affected,
        "recovered_blocks": recovered,
        "power": extract_power_metrics(text),
        "times": extract_time_mentions(text),
        "sen_status": detect_sen_status(text),
    }
