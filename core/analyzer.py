import datetime
import calendar
import json
import logging
from core.classes import (
    UneAnalysis,
    TelegramMessageWithCount,
    TelegramMessage,
    SENAnalysis,
    SENFailureAnalysisEvent,
    BlockAnalysis,
    AffectedZone,
    PowerPoint,
    ThermalPlantStats,
    WorstDay,
    CalmestDay,
    YearRecords,
    TopQuote,
)
from core.database import get_messages_by_year
from dataclasses import asdict
from collections import Counter
import re
from zoneinfo import ZoneInfo

from core.serializers import UneAnalysisEncoder

logger = logging.getLogger(__name__)

POSITIVE_EMOJIS = {'👍', '👏', '😁', '❤', '🙏'}
NEGATIVE_EMOJIS = {'👎', '🤬', '😱', '😢'}
STOP_WORDS = {
    'el','la','los','las','un','una','unos','unas',
    'de','del','al','a','en','por','para','con','sin','sobre','entre',
    'y','o','u','que','como','cuando','donde','cuanto','quien','cual',
    'yo','tú','él','ella','nosotros','vosotros','ellos','ellas',
    'me','te','se','nos','os','lo','le','les',
    'mi','tu','su','sus','nuestro','nuestra','vuestro','vuestra',
    'es','son','fue','eran','ser','estar','está','están','hay','había',
    'porque','pero','si','no','sí','ya','muy','más','menos','también',
    'todo','nada','algo','cada','cualquier','ninguno','ninguna',
    'este','esta','estos','estas','ese','esa','esos','esas',
    'entonces','pues','aunque','además','solo','solamente','mismo','misma',
    'ahí','aquí','allí','allá','hacia','desde','hasta','dentro','fuera',
    'bien','mal','ahora','antes','después','luego','siempre','nunca',
    'encuentran', 'todos', 'encuentra', 'estén', 'pm', 'san'
}
SEN_PATTERNS = [
    "sen", "sistema electrico nacional", "sistema eléctrico nacional",
    "sistema electroenergetico nacional", "sistema electroenergético nacional"
]
START_FAILURE_TRIGGER = "desconexión del sistema electroenergético nacional"
END_FAILURE_TRIGGER = "100 %"

BLOCK_COUNT = 6

BLOCK_START_PATTERNS = [
    r"(afect|déficit|fuera).*bloque\s*(no\.?|nº)?\s*{i}",
    r"bloque\s*(no\.?|nº)?\s*{i}.*(afect|déficit|fuera)",
]

BLOCK_END_PATTERNS = [
    r"(restablec|recuper|normaliz|cierra).*bloque\s*(no\.?|nº)?\s*{i}"
]

BLOCK_LIST_PATTERN = re.compile(r"bloques?:?\s*([1-6,\s]+)", re.IGNORECASE)

MAX_BLOCK_DURATION_SECONDS = 36 * 60 * 60

def analyze_data(year: int):
    """
    Analyze the UNE data for UNE-Unwrapped project and exports it to JSON on root path
    :param year: The current year
    :return:
    """
    messages = get_messages_by_year(year)
    messages.sort(key=lambda message: message.date_cuba)
    messages_with_text = [m for m in messages if m.text]
    data = UneAnalysis()

    # ------------------------------------ GENERAL INFORMATION --------------------------------- #
    data.sync_date = datetime.datetime.now(ZoneInfo("America/Havana"))
    data.year = year
    data.first_message = messages_with_text[0]
    data.last_message = messages_with_text[-1]
    data.shortest_message = TelegramMessageWithCount(**asdict(m := min(messages_with_text, key=lambda x: len(x.text))),
                                                     count=len(m.text))
    data.longest_message = TelegramMessageWithCount(**asdict(m := max(messages_with_text, key=lambda x: len(x.text))),
                                                    count=len(m.text))

    # ------------------------------------------ TOTALS --------------------------------------- #
    data.total_messages = len(messages)
    data.total_views = sum(m.views for m in messages)
    data.total_replies = sum(m.replies for m in messages)
    data.total_reactions = sum(sum(m.reactions.values()) for m in messages)
    data.total_erased_messages = (messages[-1].id - messages[0].id + 1) - len(messages)
    data.total_positive_reactions = sum(
        sum(count for emoji, count in m.reactions.items() if emoji in POSITIVE_EMOJIS) for m in messages)
    data.total_negative_reactions = sum(
        sum(count for emoji, count in m.reactions.items() if emoji in NEGATIVE_EMOJIS) for m in messages)

    # ------------------------------------------- AVGs ------------------------------------------- #
    total_v, total_rep, total_react, total_pos, total_neg, total_len = 0, 0, 0, 0, 0, 0
    n = len(messages)

    for m in messages:
        total_v += m.views
        total_rep += m.replies
        total_len += len(m.text)

        for emoji, count in m.reactions.items():
            total_react += count
            if emoji in POSITIVE_EMOJIS:
                total_pos += count
            elif emoji in NEGATIVE_EMOJIS:
                total_neg += count

    data.avg_views = round(total_v / n)
    data.avg_replies = round(total_rep / n)
    data.avg_reactions = round(total_react / n)
    data.avg_positive_reactions = round(total_pos / n)
    data.avg_negative_reactions = round(total_neg / n)
    data.avg_text_length = round(total_len / n)

    # ----------------------------------------- DATES ----------------------------------------------- #
    data.monthly_views = {i: 0 for i in range(1, 13)}
    data.monthly_replies = {i: 0 for i in range(1, 13)}
    data.monthly_reactions = {i: 0 for i in range(1, 13)}
    data.monthly_messages = {i: 0 for i in range(1, 13)}
    data.daily_messages = {i: 0 for i in range(1, 367)}
    for m in messages:
        if m.date_cuba_d:
            month = m.date_cuba_d.month
            data.monthly_messages[month] += 1
            data.monthly_views[month] += m.views
            data.monthly_replies[month] += m.replies
            data.monthly_reactions[month] += sum(m.reactions.values())

            week_number = m.date_cuba_d.isocalendar()[1]
            day_of_year = m.date_cuba_d.timetuple().tm_yday
            data.daily_messages[day_of_year] += 1

            # ---------------------------------------- DISTRIBUTIONS ---------------------------------------- #
    reac_counts = Counter()
    for m in messages:
        reac_counts.update(m.reactions)
    data.distribution_reaction = dict(sorted(reac_counts.items(), key=lambda item: item[1], reverse=True))

    data.distribution_message = {mt: 0 for mt in [1,2,3,4,5]}
    re_blocks = re.compile(r'\b(bloque|b|bloque no\.?)[ \.#]*([1-6])', re.IGNORECASE)
    for m in messages:
        text_lower = (m.text or "").lower()
        classified = False

        if "disparado automático por frecuencia" in text_lower or "daf" in text_lower:
            data.distribution_message[2] += 1
            classified = True
        elif "disparo del circuito" in text_lower or "averías primarias" in text_lower or "averías secundarias" in text_lower or "transformadores dañados" in text_lower:
            data.distribution_message[3] += 1
            classified = True
        elif "en el día de ayer" in text_lower:
            data.distribution_message[4] += 1
            classified = True
        elif re_blocks.search(text_lower):
            data.distribution_message[5] += 1
            classified = True
        if not classified:
            data.distribution_message[1] += 1

    # ---------------------------------------------- TOPs ------------------------------------------- #
    top_viewed = sorted(messages_with_text, key=lambda m: m.views, reverse=True)[:3]
    data.top3_most_viewed_messages = [__to_msg_count(m, m.views) for m in top_viewed]

    top_replied = sorted(messages_with_text, key=lambda m: m.replies, reverse=True)[:3]
    data.top3_most_replied_messages = [__to_msg_count(m, m.replies) for m in top_replied]

    top_pos = sorted(
        messages_with_text,
        key=lambda m: sum(count for emo, count in m.reactions.items() if emo in POSITIVE_EMOJIS),
        reverse=True
    )[:3]
    data.top3_most_positive_reaction_messages = [
        __to_msg_count(m, sum(count for emo, count in m.reactions.items() if emo in POSITIVE_EMOJIS))
        for m in top_pos
    ]

    top_neg = sorted(
        messages_with_text,
        key=lambda m: sum(count for emo, count in m.reactions.items() if emo in NEGATIVE_EMOJIS),
        reverse=True
    )[:3]
    data.top3_most_negative_reaction_messages = [
        __to_msg_count(m, sum(count for emo, count in m.reactions.items() if emo in NEGATIVE_EMOJIS))
        for m in top_neg
    ]

    all_text = " ".join([m.text.lower() for m in messages if m.text])
    words = re.findall(r'[a-záéíóúüñ]{2,}', all_text)
    word_counts = Counter(word for word in words if word not in STOP_WORDS)
    data.top25_most_repeated_words = dict(word_counts.most_common(25))

    # --------------------------------------------- EXTRA ANALYSIS ------------------------------------ #
    # ------------------------ BLOCKS -------------------- #
    alert_emojis = r'[✅🚨‼️❗]'
    data.blocks_analysis = [BlockAnalysis(number=i) for i in range(1, 7)]

    def get_block_pattern(i):
        return rf'(bloques?|no\.?|y|,|\s)[ \.#]*{i}'

    for i in range(1, 7):
        block_pattern = rf'(bloque|b|bloque no\.?)[ \.#]*{i}'
        pattern_for_this_block = get_block_pattern(i)
        re_mentions = re.compile(rf'{pattern_for_this_block}\b', re.IGNORECASE)
        re_recovery = re.compile(rf'restablecimiento[\s\S]*?{pattern_for_this_block}', re.IGNORECASE)
        re_exclusion = re.compile(rf'(bloque|b|no\.?)[ \.#]*{i}[\s\S]*?afectaci[oó]n', re.IGNORECASE)
        block_idx = i - 1

        for m in messages:
            text_lower = (m.text or "").lower()

            if re_mentions.search(text_lower):
                data.blocks_analysis[block_idx].mentions += 1

            if "restablecimiento" in text_lower:
                if re_recovery.search(text_lower):
                    if not re_exclusion.search(text_lower):
                        data.blocks_analysis[block_idx].declared_recoveries += 1

            if re.search(rf'{alert_emojis}[\s\S]*?{block_pattern}', text_lower):
                data.blocks_analysis[block_idx].declared_affectations += 1
                if re.search(rf'{alert_emojis}[\s\S]*?{block_pattern}[\s\S]*?emergencia', text_lower):
                    data.blocks_analysis[block_idx].declared_emergencies += 1

    # ------------------------ SEN ------------------------ #
    # Inicializar SEN Analysis
    data.sen_analysis = SENAnalysis()
    current_event = None
    all_events = []
    mentions_count = 0

    for m in messages:
        text_lower = m.text.lower()

        if any(pattern in text_lower for pattern in SEN_PATTERNS):
            mentions_count += 1

        if current_event is None:
            if START_FAILURE_TRIGGER in text_lower:
                current_event = SENFailureAnalysisEvent(
                    start_date=m.date_cuba,
                    start_date_d=m.date_cuba_d,
                    start_message=m
                )
        else:
            if END_FAILURE_TRIGGER in text_lower:
                current_event.end_date = m.date_cuba
                current_event.end_date_d = m.date_cuba_d
                current_event.end_message = m

                if current_event.start_date_d and current_event.end_date_d:
                    duration = (current_event.end_date_d - current_event.start_date_d).total_seconds()
                    current_event.estimated_duration_seconds = int(duration)

                all_events.append(current_event)
                current_event = None

    data.sen_analysis.mentions = mentions_count
    data.sen_analysis.total_failure_events = len(all_events)
    data.sen_analysis.failure_events = all_events

    # ------------------------ BLOCKS - ESTIMATED AFFECTED SECONDS -------------------- #

    block_monthly_off = {
        i: {m: 0 for m in range(1, 13)}
        for i in range(1, BLOCK_COUNT + 1)
    }

    block_weekday_off = {
        i: {d: 0 for d in range(7)}
        for i in range(1, BLOCK_COUNT + 1)
    }

    days_per_month = {
        m: calendar.monthrange(year, m)[1]
        for m in range(1, 13)
    }

    start_date = datetime.date(year, 1, 1)
    total_days = 366 if calendar.isleap(year) else 365

    weekday_counts = Counter(
        (start_date + datetime.timedelta(days=i)).weekday()
        for i in range(total_days)
    )

    def __accumulate_block_off(block: int, start: datetime.datetime, end: datetime.datetime):
        daily_chunks = __distribute_seconds_by_day(start, end)

        for day_dt, seconds in daily_chunks:
            month = day_dt.month
            weekday = day_dt.weekday()

            block_monthly_off[block][month] += seconds
            block_weekday_off[block][weekday] += seconds

    def __apply_block_safety_timeout(state: dict, current_time: datetime.datetime, block_idx: int):
        if state["active"] and state["start"]:
            elapsed = (current_time - state["start"]).total_seconds()
            if elapsed >= MAX_BLOCK_DURATION_SECONDS:
                end_time = state["start"] + datetime.timedelta(seconds=MAX_BLOCK_DURATION_SECONDS)
                __accumulate_block_off(block_idx, state["start"], end_time)
                state["accumulated"] += MAX_BLOCK_DURATION_SECONDS
                state["active"] = False
                state["start"] = None
                return True
        return False

    block_states = {
        i: {
            "active": False,
            "start": None,
            "accumulated": 0
        }
        for i in range(1, BLOCK_COUNT + 1)
    }

    sen_active = False

    for m in messages:
        if not m.date_cuba_d or not m.text:
            continue

        text = m.text.lower()
        t: datetime.datetime = m.date_cuba_d

        listed_blocks = __extract_blocks_from_list(text)
        is_list_message = bool(listed_blocks)

        if START_FAILURE_TRIGGER in text:
            sen_active = True
            for i in range(1, BLOCK_COUNT + 1):
                state = block_states[i]
                if state["active"]:
                    __accumulate_block_off(i, state["start"], t)
                    state["accumulated"] += int((t - state["start"]).total_seconds())
                    state["active"] = False
                    state["start"] = None
            continue

        if END_FAILURE_TRIGGER in text and sen_active:
            sen_active = False
            continue

        for i in range(1, BLOCK_COUNT + 1):
            __apply_block_safety_timeout(block_states[i], t, i)

        for i in range(1, BLOCK_COUNT + 1):
            state = block_states[i]

            if not state["active"] and __block_start_detected(i, text):
                state["active"] = True
                state["start"] = t
                continue

            if not state["active"] and is_list_message and i in listed_blocks:
                state["active"] = True
                state["start"] = t
                continue

            if state["active"] and __block_end_detected(i, text):
                __accumulate_block_off(i, state["start"], t)
                state["accumulated"] += int((t - state["start"]).total_seconds())
                state["active"] = False
                state["start"] = None
                continue

            if state["active"] and is_list_message and i not in listed_blocks:
                __accumulate_block_off(i, state["start"], t)
                state["accumulated"] += int((t - state["start"]).total_seconds())
                state["active"] = False
                state["start"] = None

    last_date = messages[-1].date_cuba_d

    for i in range(1, BLOCK_COUNT + 1):
        state = block_states[i]
        if state["active"] and state["start"] and last_date:
            __accumulate_block_off(i, state["start"], last_date)
            state["accumulated"] += int((last_date - state["start"]).total_seconds())

    for i in range(1, BLOCK_COUNT + 1):
        block = data.blocks_analysis[i - 1]
        block.weekday_off_seconds = block_weekday_off[i]
        block.weekday_off_avg_seconds = {
            d: (
                block_weekday_off[i][d] / weekday_counts[d]
                if weekday_counts[d] > 0 else 0
            )
            for d in range(7)
        }
        block.estimated_affected_seconds = (
            block_states[i]["accumulated"]
        )

    # ----------------------------------------------- AI ENRICHMENT ------------------------------------ #
    # Additive section: pulls per-message AI analysis from `message_ai_analysis` (if present)
    # and aggregates new fields onto `data`. Never mutates pre-existing fields.
    try:
        __apply_ai_enrichment(data, messages)
    except Exception as e:
        logger.warning("AI enrichment skipped due to error: %s", e)

    # ----------------------------------------------- EXPORT ------------------------------------------- #
    __export_analysis_to_json(data)


def __export_analysis_to_json(analysis: UneAnalysis):
    """
    Serialize analysis to JSON to <analysis_data_%year%.json>
    """

    filename = f"./app/public/data/analysis_data_{analysis.year}.json"

    try:
        analysis_dict = asdict(analysis)

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(
                analysis_dict,
                f,
                indent=4,
                ensure_ascii=False,
                cls=UneAnalysisEncoder
            )
        print(f"✅ Analysis exported successfully to {filename}")

    except Exception as e:
        print(f"❌ Error exporting to JSON: {e}")

def __to_msg_count(m: TelegramMessage, count_value: int) -> TelegramMessageWithCount:
    return TelegramMessageWithCount(**asdict(m), count=count_value)

def __extract_blocks_from_list(text: str) -> set[int]:
    match = BLOCK_LIST_PATTERN.search(text)
    if not match:
        return set()
    return {int(b) for b in re.findall(r"[1-6]", match.group(1))}


def __block_start_detected(block: int, text: str) -> bool:
    for pattern in BLOCK_START_PATTERNS:
        if re.search(pattern.format(i=block), text):
            return True
    return False


def __block_end_detected(block: int, text: str) -> bool:
    for pattern in BLOCK_END_PATTERNS:
        if re.search(pattern.format(i=block), text):
            return True
    return False

def __distribute_seconds_by_day(start: datetime.datetime, end: datetime.datetime):
    result = []
    current = start

    while current < end:
        next_day = (current + datetime.timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        segment_end = min(next_day, end)
        seconds = int((segment_end - current).total_seconds())
        result.append((current, seconds))
        current = segment_end

    return result


# --------------------------------- AI ENRICHMENT ----------------------------------- #
#
# We do NOT add new fields to the JSON. Instead, when AI analyses are available
# in the `message_ai_analysis` table, we use them to OVERWRITE the legacy
# fields (`distribution_message`, `blocks_analysis`, `sen_analysis`) with more
# precise numbers derived from the model.
#
# JSON shape stays identical to the original — the frontend keeps working as is,
# but the figures it shows reflect the IA-derived classification.


# Map AI category id → legacy MessageType (1..5) used in `distribution_message`.
# Legacy types:
#   1 = GENERAL_INFORMATION
#   2 = DAF
#   3 = FAILURE_BY_ZONE
#   4 = DAILY_RESUME
#   5 = BLOCK_INFORMATION
_AI_CAT_TO_LEGACY_TYPE: dict[str, int] = {
    "general_info":          1,
    "apology_communication": 1,
    "weather_impact":        1,
    "scheduled_maintenance": 1,
    "thermal_unit_status":   1,
    "daily_forecast":        1,
    "daf":                   2,
    "circuit_failure":       3,
    "zone_outage":           3,
    "zone_recovery":         3,
    "daily_resume":          4,
    "block_affectation":     5,
    "block_recovery":        5,
    "sen_failure":           5,
    "sen_recovery":          5,
}


def __apply_ai_enrichment(data: UneAnalysis, messages: list[TelegramMessage]):
    """
    When AI analyses are available, recompute `distribution_message`,
    `blocks_analysis`, and `sen_analysis` using them. This keeps the JSON
    shape identical to the original but with figures derived from the model
    instead of brittle regex.

    Falls back silently to the legacy values already computed if no AI rows
    exist for this year.
    """
    from core.ai.db import get_ai_analyses_by_year

    ai_map = get_ai_analyses_by_year(data.year)
    if not ai_map:
        return

    sorted_msgs = [m for m in messages if m.date_cuba_d]
    sorted_msgs.sort(key=lambda m: m.date_cuba_d)

    # ---------------- distribution_message (refined) ---------------- #
    legacy_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for m in messages:
        ai = ai_map.get(m.id)
        if ai is None or ai.ai_failed:
            # Keep the legacy regex bucket if we have no successful AI row.
            # We re-classify with the same regex used originally to avoid
            # double-counting (the legacy block already counted these).
            legacy_dist[_legacy_classify_text(m.text or "")] += 1
            continue
        legacy_dist[_AI_CAT_TO_LEGACY_TYPE.get(ai.category or "general_info", 1)] += 1
    data.distribution_message = legacy_dist

    # ---------------- blocks_analysis (refined) ---------------- #
    # Reset counters; we'll rebuild from AI data exclusively.
    blocks: list[BlockAnalysis] = [BlockAnalysis(number=i) for i in range(1, BLOCK_COUNT + 1)]

    for m in messages:
        ai = ai_map.get(m.id)
        if ai is None or ai.ai_failed:
            continue
        affected = set(ai.affected_blocks or [])
        recovered = set(ai.recovered_blocks or [])
        is_critical = (ai.severity or "") == "critical"

        for i in affected:
            if 1 <= i <= BLOCK_COUNT:
                blk = blocks[i - 1]
                blk.mentions += 1
                blk.declared_affectations += 1
                if is_critical:
                    blk.declared_emergencies += 1
        for i in recovered:
            if 1 <= i <= BLOCK_COUNT:
                blk = blocks[i - 1]
                blk.mentions += 1
                blk.declared_recoveries += 1

    # estimated_affected_seconds + weekday_off_seconds — derive from AI events.
    blocks = _compute_block_durations_from_ai(blocks, sorted_msgs, ai_map, data.year)

    # Detailed AI stats per block (monthly/hourly/zones/co-occurrences/severity/worst day)
    blocks = _compute_block_detailed_stats(blocks, sorted_msgs, ai_map)

    data.blocks_analysis = blocks

    # ---------------- sen_analysis (refined) ---------------- #
    sen = SENAnalysis()
    sen.mentions = sum(
        1
        for m in messages
        if (ai := ai_map.get(m.id)) is not None
        and not ai.ai_failed
        and (ai.sen_status in {"active_failure", "recovering", "normal"} or ai.category in {"sen_failure", "sen_recovery"})
    )

    failure_events: list[SENFailureAnalysisEvent] = []
    open_event: SENFailureAnalysisEvent | None = None
    for m in sorted_msgs:
        ai = ai_map.get(m.id)
        if ai is None or ai.ai_failed:
            continue
        if open_event is None and ai.category == "sen_failure":
            open_event = SENFailureAnalysisEvent(
                start_date=m.date_cuba,
                start_date_d=m.date_cuba_d,
                start_message=m,
            )
            continue
        if open_event is not None and (
            ai.sen_status == "normal"
            or (ai.category == "sen_recovery" and "100" in (m.text or ""))
        ):
            open_event.end_date = m.date_cuba
            open_event.end_date_d = m.date_cuba_d
            open_event.end_message = m
            if open_event.start_date_d and open_event.end_date_d:
                duration = (open_event.end_date_d - open_event.start_date_d).total_seconds()
                # Cap at 24h as a safety bound (same heuristic as legacy code).
                open_event.estimated_duration_seconds = min(int(duration), MAX_BLOCK_DURATION_SECONDS)
            failure_events.append(open_event)
            open_event = None

    sen.failure_events = failure_events
    sen.total_failure_events = len(failure_events)
    data.sen_analysis = sen

    # ---------------- new compact AI sections (additive) ---------------- #
    _populate_ai_sections(data, messages, sorted_msgs, ai_map)


# ---------------- helpers for the new AI-derived sections ---------------- #


_AI_CATEGORY_LABELS_ES: dict[str, str] = {
    "general_info":          "Información general",
    "apology_communication": "Comunicación / disculpa",
    "weather_impact":        "Impacto meteorológico",
    "scheduled_maintenance": "Mantenimiento programado",
    "thermal_unit_status":   "Estado unidad termoeléctrica",
    "daily_forecast":        "Pronóstico diario",
    "daily_resume":          "Resumen diario",
    "daf":                   "Disparado Automático por Frecuencia",
    "circuit_failure":       "Falla de circuito local",
    "zone_outage":           "Afectación zonal",
    "zone_recovery":         "Recuperación zonal",
    "block_affectation":     "Afectación de bloque",
    "block_recovery":        "Restablecimiento de bloque",
    "sen_failure":           "Desconexión total del SEN",
    "sen_recovery":          "Restablecimiento del SEN",
}


_SEVERITY_RANK = {"low": 1, "medium": 2, "high": 3, "critical": 4}


def _build_thermal_city_lookup() -> dict[str, str]:
    """Map canonical CTE name → city, sourced from the gazetteer."""
    try:
        from core.ai.gazetteer import THERMAL_PLANTS_CUBA
        return {p.canonical: (p.extra.get("city") or "") for p in THERMAL_PLANTS_CUBA}
    except Exception:
        return {}


_THERMAL_CITY = _build_thermal_city_lookup()


def _populate_ai_sections(
    data: UneAnalysis,
    messages: list[TelegramMessage],
    sorted_msgs: list[TelegramMessage],
    ai_map: dict,
) -> None:
    """Compute the compact AI sections that the frontend will render."""
    cat_counts: Counter[str] = Counter()
    severity_counts: Counter[int, int] = Counter()  # day_of_year -> max severity rank
    severity_by_day: dict[int, int] = {}
    hour_counts: Counter[int] = Counter()
    zones: dict[tuple[str, str], dict] = {}
    units: dict[str, dict] = {}
    power: list[PowerPoint] = []
    last_sen_status: str = "unknown"

    daily_critical: dict[str, dict] = {}  # date_str -> {critical, high, blocks, deficit, msg_id, summary}

    for m in sorted_msgs:
        ai = ai_map.get(m.id)
        if ai is None or ai.ai_failed:
            continue
        cat_counts[ai.category or "general_info"] += 1

        # severity heatmap by day_of_year
        if m.date_cuba_d:
            doy = m.date_cuba_d.timetuple().tm_yday
            rank = _SEVERITY_RANK.get(ai.severity or "low", 1)
            cur = severity_by_day.get(doy, 0)
            if rank > cur:
                severity_by_day[doy] = rank

            # hour-of-day count for critical/high events
            if (ai.severity or "") in {"high", "critical"}:
                hour_counts[m.date_cuba_d.hour] += 1

            # daily aggregation for "worst day"
            day_key = m.date_cuba[:10] if m.date_cuba else ""
            if day_key:
                d = daily_critical.setdefault(
                    day_key,
                    {
                        "critical": 0,
                        "high": 0,
                        "blocks": set(),
                        "deficit": None,
                        "msg_id": 0,
                        "summary": "",
                    },
                )
                if (ai.severity or "") == "critical":
                    d["critical"] += 1
                elif (ai.severity or "") == "high":
                    d["high"] += 1
                for b in ai.affected_blocks or []:
                    if 1 <= b <= 6:
                        d["blocks"].add(b)
                if ai.power_deficit_mw and (d["deficit"] is None or ai.power_deficit_mw > d["deficit"]):
                    d["deficit"] = ai.power_deficit_mw
                if (ai.severity or "") == "critical" and not d["msg_id"]:
                    d["msg_id"] = m.id
                    d["summary"] = ai.summary or ""

        # zones (provinces, municipalities, circuits)
        is_aff = (ai.event_type or "") in {"failure", "blackout", "scheduled_cut"}
        is_rec = (ai.event_type or "") == "recovery"
        for prov in ai.affected_provinces or []:
            _touch_zone(zones, "province", prov, is_aff, is_rec)
        for muni in ai.affected_municipalities or []:
            _touch_zone(zones, "municipality", muni, is_aff, is_rec)
        for circ in ai.mentioned_circuits or []:
            _touch_zone(zones, "circuit", circ, is_aff, is_rec)

        # thermal units
        for u in ai.mentioned_units or []:
            if not isinstance(u, dict):
                continue
            canonical = (u.get("canonical") or "").strip()
            if not canonical:
                continue
            # Resolve the underlying plant name for unit-level entries (e.g. "CTE Felton U2")
            plant_name = u.get("plant") or canonical
            city = _THERMAL_CITY.get(canonical) or _THERMAL_CITY.get(plant_name) or ""
            ue = units.setdefault(
                canonical,
                {
                    "city": city,
                    "mentions": 0,
                    "failures": 0,
                    "recoveries": 0,
                    "monthly": [0] * 12,
                    "last_status": "unknown",
                },
            )
            ue["mentions"] += 1
            if is_aff:
                ue["failures"] += 1
                ue["last_status"] = "active_failure"
            elif is_rec:
                ue["recoveries"] += 1
                ue["last_status"] = "normal"
            if m.date_cuba_d:
                ue["monthly"][m.date_cuba_d.month - 1] += 1

        # power timeline — restricted to authoritative reports (daily_resume + daily_forecast)
        # to keep the JSON compact. Random in-message MW mentions add noise.
        if (
            ai.category in {"daily_resume", "daily_forecast"}
            and any(
                v is not None
                for v in (ai.power_demand_mw, ai.power_availability_mw, ai.power_deficit_mw)
            )
        ):
            power.append(
                PowerPoint(
                    date=m.date_cuba or "",
                    demand=ai.power_demand_mw,
                    availability=ai.power_availability_mw,
                    deficit=ai.power_deficit_mw,
                    is_forecast=(ai.category == "daily_forecast"),
                )
            )

        # latest sen_status seen
        if ai.sen_status and ai.sen_status != "unknown":
            last_sen_status = ai.sen_status

    # ---------------- distribution: 15 AI categories ---------------- #
    data.ai_categories_distribution = dict(
        sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)
    )

    # ---------------- daily_severity (string per day) ---------------- #
    rank_to_label = {1: "low", 2: "medium", 3: "high", 4: "critical"}
    data.daily_severity = {
        doy: rank_to_label.get(rank, "low") for doy, rank in severity_by_day.items()
    }

    # ---------------- hour_of_day_severity ---------------- #
    data.hour_of_day_severity = {h: hour_counts.get(h, 0) for h in range(24)}

    # ---------------- zones (drop pure-mention noise; sort by impact) ---------------- #
    zones_list = [
        AffectedZone(
            name=name,
            kind=kind,
            mentions=info["mentions"],
            affectations=info["affectations"],
            recoveries=info["recoveries"],
        )
        for (kind, name), info in zones.items()
        if info["affectations"] + info["recoveries"] > 0
    ]
    zones_list.sort(key=lambda z: (z.affectations + z.recoveries, z.mentions), reverse=True)
    data.affected_zones = zones_list[:40]

    # ---------------- thermal_units ---------------- #
    data.thermal_units = sorted(
        [
            ThermalPlantStats(
                canonical=name,
                city=info["city"],
                mentions=info["mentions"],
                failures=info["failures"],
                recoveries=info["recoveries"],
                monthly_activity=info["monthly"],
                last_status=info["last_status"],
            )
            for name, info in units.items()
        ],
        key=lambda u: u.failures + u.recoveries,
        reverse=True,
    )

    # ---------------- power_timeline (de-duplicated by hour, latest wins) ---------------- #
    # Restricted to daily_resume + daily_forecast above, so this is naturally small
    # (~1-2 per day). Dedup by YYYY-MM-DD HH bucket, keeping the last record.
    seen_buckets: dict[str, PowerPoint] = {}
    for p in power:
        bucket = p.date[:13] if p.date else ""
        seen_buckets[bucket] = p
    power_dedup = list(seen_buckets.values())
    power_dedup.sort(key=lambda p: p.date)
    data.power_timeline = power_dedup

    # ---------------- worst_day ---------------- #
    if daily_critical:
        worst_key, worst = max(
            daily_critical.items(),
            key=lambda kv: (kv[1]["critical"], kv[1]["high"], len(kv[1]["blocks"])),
        )
        if worst["critical"] > 0 or worst["high"] >= 3:
            data.worst_day = WorstDay(
                date=worst_key,
                critical_events=worst["critical"],
                high_events=worst["high"],
                affected_blocks_count=len(worst["blocks"]),
                deficit_mw=worst["deficit"],
                sample_message_id=worst["msg_id"],
                sample_summary=worst["summary"],
            )

    # ---------------- live_grid_status ---------------- #
    data.live_grid_status = last_sen_status

    # ---------------- new wrapped sections ---------------- #
    _populate_wrapped_sections(data, messages, sorted_msgs, ai_map, daily_critical, severity_by_day)


def _populate_wrapped_sections(
    data: UneAnalysis,
    messages: list[TelegramMessage],
    sorted_msgs: list[TelegramMessage],
    ai_map: dict,
    daily_critical: dict[str, dict],
    severity_by_day: dict[int, int],
) -> None:
    """Compute records, health score, weekly heatmap, sentiment, top quotes, etc."""
    year = data.year

    # ---- year_records: longest clean streak + days since markers ---- #
    is_leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)
    total_days = 366 if is_leap else 365

    # Date string per day-of-year for this year
    def doy_to_date(doy: int) -> datetime.date:
        return datetime.date(year, 1, 1) + datetime.timedelta(days=doy - 1)

    # Determine which days are "clean" (no high/critical events)
    # severity_by_day: doy -> rank (1=low, 2=med, 3=high, 4=crit). missing = no events.
    longest_streak = 0
    streak_start = None
    streak_end = None
    cur_streak = 0
    cur_start = None
    today_doy_cap = total_days  # streak runs over the entire year

    last_critical_doy: int | None = None
    last_block_aff_doy: int | None = None

    for doy in range(1, total_days + 1):
        rank = severity_by_day.get(doy, 0)
        is_clean = rank < 3  # high+ counts as a non-clean day
        if is_clean:
            if cur_streak == 0:
                cur_start = doy
            cur_streak += 1
            if cur_streak > longest_streak:
                longest_streak = cur_streak
                streak_start = cur_start
                streak_end = doy
        else:
            cur_streak = 0
            cur_start = None
            if rank >= 4:  # critical
                last_critical_doy = doy

    # Last block affectation date (any day with at least one affected block in critical/medium events)
    for m in sorted_msgs:
        ai = ai_map.get(m.id)
        if ai is None or ai.ai_failed:
            continue
        if ai.affected_blocks and m.date_cuba_d:
            doy = m.date_cuba_d.timetuple().tm_yday
            if last_block_aff_doy is None or doy > last_block_aff_doy:
                last_block_aff_doy = doy

    # Last SEN failure
    last_sen_failure_doy: int | None = None
    for fe in (data.sen_analysis.failure_events if data.sen_analysis else []):
        if fe.start_date_d and fe.start_date_d.year == year:
            d = fe.start_date_d.timetuple().tm_yday
            if last_sen_failure_doy is None or d > last_sen_failure_doy:
                last_sen_failure_doy = d

    # "Today reference" inside the year — last day with any data is the tail of the year analyzed.
    last_known_doy = max((m.date_cuba_d.timetuple().tm_yday for m in messages if m.date_cuba_d), default=total_days)

    def days_since(doy: int | None) -> int | None:
        if doy is None:
            return None
        return max(0, last_known_doy - doy)

    records = YearRecords(
        longest_clean_streak_days=longest_streak,
        longest_clean_streak_start=doy_to_date(streak_start).isoformat() if streak_start else "",
        longest_clean_streak_end=doy_to_date(streak_end).isoformat() if streak_end else "",
        days_since_sen_failure=days_since(last_sen_failure_doy),
        days_since_critical_event=days_since(last_critical_doy),
        days_since_block_affectation=days_since(last_block_aff_doy),
        last_sen_failure_date=doy_to_date(last_sen_failure_doy).isoformat() if last_sen_failure_doy else "",
        last_critical_event_date=doy_to_date(last_critical_doy).isoformat() if last_critical_doy else "",
        last_block_affectation_date=doy_to_date(last_block_aff_doy).isoformat() if last_block_aff_doy else "",
    )
    data.year_records = records

    # ---- calmest_day ---- #
    if daily_critical:
        # Look for a day with 0 critical AND lowest high events
        candidates = [
            (k, v) for k, v in daily_critical.items()
            if v["critical"] == 0 and v["high"] <= 1
        ]
        if candidates:
            calm_key, calm_val = min(candidates, key=lambda kv: (kv[1]["high"], kv[1]["critical"]))
            data.calmest_day = CalmestDay(
                date=calm_key,
                total_events=calm_val["high"] + calm_val["critical"],
                sample_message_id=calm_val.get("msg_id", 0) or 0,
            )

    # ---- weekly_hourly_severity (7×24 = 168 cells, weekday=0 Monday) ---- #
    weekly_hourly: Counter = Counter()
    for m in sorted_msgs:
        ai = ai_map.get(m.id)
        if ai is None or ai.ai_failed or m.date_cuba_d is None:
            continue
        if (ai.severity or "") in {"high", "critical"}:
            wd = m.date_cuba_d.weekday()  # Monday=0
            hr = m.date_cuba_d.hour
            weekly_hourly[f"{wd}-{hr}"] += 1
    data.weekly_hourly_severity = dict(weekly_hourly)

    # ---- ai_categories_monthly (12 monthly counts per category) ---- #
    monthly_cats: dict[str, list[int]] = {}
    for m in sorted_msgs:
        ai = ai_map.get(m.id)
        if ai is None or ai.ai_failed or m.date_cuba_d is None:
            continue
        cat = ai.category or "general_info"
        if cat not in monthly_cats:
            monthly_cats[cat] = [0] * 12
        monthly_cats[cat][m.date_cuba_d.month - 1] += 1
    data.ai_categories_monthly = monthly_cats

    # ---- avg_ai_confidence ---- #
    confidences = [
        ai.category_confidence or 0
        for ai in ai_map.values()
        if ai is not None and not ai.ai_failed
    ]
    data.avg_ai_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 0.0

    # ---- sentiment_monthly: ratio negative reactions / total per month ---- #
    POSITIVE_EMOJIS_LOCAL = {'👍', '👏', '😁', '❤', '🙏'}
    NEGATIVE_EMOJIS_LOCAL = {'👎', '🤬', '😱', '😢'}
    monthly_neg: dict[int, int] = {m: 0 for m in range(1, 13)}
    monthly_total: dict[int, int] = {m: 0 for m in range(1, 13)}
    for m in messages:
        if not m.date_cuba_d:
            continue
        month = m.date_cuba_d.month
        for emoji, count in (m.reactions or {}).items():
            monthly_total[month] += count
            if emoji in NEGATIVE_EMOJIS_LOCAL:
                monthly_neg[month] += count
            elif emoji in POSITIVE_EMOJIS_LOCAL:
                # already counted in total
                pass
    data.sentiment_monthly = {
        mo: round(monthly_neg[mo] / monthly_total[mo], 4) if monthly_total[mo] > 0 else 0.0
        for mo in range(1, 13)
    }

    # ---- top_quotes (5 from existing top lists, with text preview) ---- #
    quotes: list[TopQuote] = []
    seen_ids: set[int] = set()
    for src_list, metric_name in [
        (data.top3_most_viewed_messages or [], 'views'),
        (data.top3_most_replied_messages or [], 'replies'),
        (data.top3_most_positive_reaction_messages or [], 'reactions'),
        (data.top3_most_negative_reaction_messages or [], 'reactions'),
    ]:
        for tm in src_list:
            if tm.id in seen_ids:
                continue
            seen_ids.add(tm.id)
            preview = (tm.text or "").strip().replace("\n", " ")
            if len(preview) > 280:
                preview = preview[:277] + "..."
            quotes.append(
                TopQuote(
                    message_id=tm.id,
                    text_preview=preview,
                    date=tm.date_cuba or "",
                    views=tm.views or 0,
                    reactions_total=sum((tm.reactions or {}).values()),
                    metric=metric_name,
                )
            )
            if len(quotes) >= 5:
                break
        if len(quotes) >= 5:
            break
    data.top_quotes = quotes

    # ---- health_score (0..100) ---- #
    # Components:
    #  - clean_pct: % of days with no high/critical events (0..100, 30 weight)
    #  - recovery_ratio: recoveries vs affectations across blocks (0..100, 25 weight)
    #  - sen_penalty: 100 - 10 per total_failure_events (0..100, 25 weight, capped)
    #  - sentiment_score: 100 - 100*avg_negative_ratio (0..100, 20 weight)
    days_with_events = sum(1 for r in severity_by_day.values() if r >= 3)
    clean_pct = max(0, 100 - round(100 * days_with_events / max(1, total_days)))

    total_aff = sum(b.declared_affectations for b in (data.blocks_analysis or []))
    total_rec = sum(b.declared_recoveries for b in (data.blocks_analysis or []))
    recovery_ratio = round(min(100, 100 * total_rec / total_aff)) if total_aff > 0 else 50

    sen_events = data.sen_analysis.total_failure_events if data.sen_analysis else 0
    sen_penalty = max(0, 100 - sen_events * 10)

    avg_neg = (
        sum(data.sentiment_monthly.values()) / max(1, len([v for v in data.sentiment_monthly.values() if v > 0]))
        if data.sentiment_monthly else 0
    )
    sentiment_score = round(max(0, 100 - 100 * avg_neg))

    health_score = round(
        0.30 * clean_pct
        + 0.25 * recovery_ratio
        + 0.25 * sen_penalty
        + 0.20 * sentiment_score
    )
    data.health_score = max(0, min(100, health_score))
    data.health_breakdown = {
        "clean_pct": clean_pct,
        "recovery_ratio": recovery_ratio,
        "sen_penalty": sen_penalty,
        "sentiment_score": sentiment_score,
    }

    # ---- blackout_probability_now: based on this weekday + hour from the year's data ---- #
    # Use the most recent date in the year as "now reference"
    if last_known_doy:
        ref_date = doy_to_date(last_known_doy)
        ref_wd = ref_date.weekday()
        # Sample what hour the user is most likely to look (peak hour based on data)
        peak_hour = max(data.hour_of_day_severity.items(), key=lambda kv: kv[1])[0] if data.hour_of_day_severity else 18
        bucket_key = f"{ref_wd}-{peak_hour}"
        bucket_count = data.weekly_hourly_severity.get(bucket_key, 0)
        max_bucket = max(data.weekly_hourly_severity.values()) if data.weekly_hourly_severity else 1
        prob = round(min(100, max(0, 100 * bucket_count / max(1, max_bucket))))
        data.blackout_probability_now = prob


def _touch_zone(zones: dict, kind: str, name: str, is_aff: bool, is_rec: bool) -> None:
    key = (kind, name)
    e = zones.get(key)
    if e is None:
        e = {"mentions": 0, "affectations": 0, "recoveries": 0}
        zones[key] = e
    e["mentions"] += 1
    if is_aff:
        e["affectations"] += 1
    if is_rec:
        e["recoveries"] += 1


def _legacy_classify_text(text: str) -> int:
    """Replicates the regex classifier used in the original analyzer body."""
    text_lower = (text or "").lower()
    if not text_lower:
        return 1
    if "disparado automático por frecuencia" in text_lower or "daf" in text_lower:
        return 2
    if (
        "disparo del circuito" in text_lower
        or "averías primarias" in text_lower
        or "averías secundarias" in text_lower
        or "transformadores dañados" in text_lower
    ):
        return 3
    if "en el día de ayer" in text_lower:
        return 4
    if re.search(r'\b(bloque|b|bloque no\.?)[ \.#]*([1-6])', text_lower, re.IGNORECASE):
        return 5
    return 1


def _compute_block_durations_from_ai(
    blocks: list[BlockAnalysis],
    sorted_msgs: list[TelegramMessage],
    ai_map: dict,
    year: int,
):
    """
    Derive per-block off-time using AI affected/recovered events. For each block
    we walk the chronological stream, opening an interval on each affectation
    and closing it on the next recovery (or capping at MAX_BLOCK_DURATION_SECONDS).
    """
    block_monthly_off = {i: {m: 0 for m in range(1, 13)} for i in range(1, BLOCK_COUNT + 1)}
    block_weekday_off = {i: {d: 0 for d in range(7)} for i in range(1, BLOCK_COUNT + 1)}

    start_date = datetime.date(year, 1, 1)
    total_days = 366 if calendar.isleap(year) else 365
    weekday_counts = Counter(
        (start_date + datetime.timedelta(days=i)).weekday() for i in range(total_days)
    )

    open_starts: dict[int, datetime.datetime] = {}
    accumulated: dict[int, int] = {i: 0 for i in range(1, BLOCK_COUNT + 1)}

    def _accumulate(block: int, start: datetime.datetime, end: datetime.datetime):
        if end <= start:
            return
        for day_dt, seconds in __distribute_seconds_by_day(start, end):
            block_monthly_off[block][day_dt.month] += seconds
            block_weekday_off[block][day_dt.weekday()] += seconds

    for m in sorted_msgs:
        ai = ai_map.get(m.id)
        if ai is None or ai.ai_failed:
            continue
        t = m.date_cuba_d
        if t is None:
            continue

        # Safety: close out any interval that has been open longer than the cap.
        for i in range(1, BLOCK_COUNT + 1):
            start = open_starts.get(i)
            if start is not None and (t - start).total_seconds() >= MAX_BLOCK_DURATION_SECONDS:
                end = start + datetime.timedelta(seconds=MAX_BLOCK_DURATION_SECONDS)
                _accumulate(i, start, end)
                accumulated[i] += MAX_BLOCK_DURATION_SECONDS
                open_starts.pop(i, None)

        for i in ai.affected_blocks or []:
            if 1 <= i <= BLOCK_COUNT and i not in open_starts:
                open_starts[i] = t

        for i in ai.recovered_blocks or []:
            if 1 <= i <= BLOCK_COUNT and i in open_starts:
                start = open_starts.pop(i)
                _accumulate(i, start, t)
                accumulated[i] += int((t - start).total_seconds())

    # Close any still-open intervals at the last message.
    if sorted_msgs:
        last_t = sorted_msgs[-1].date_cuba_d
        for i, start in list(open_starts.items()):
            if last_t and last_t > start:
                _accumulate(i, start, last_t)
                accumulated[i] += int((last_t - start).total_seconds())

    for blk in blocks:
        i = blk.number
        blk.weekday_off_seconds = block_weekday_off[i]
        blk.weekday_off_avg_seconds = {
            d: (block_weekday_off[i][d] / weekday_counts[d] if weekday_counts[d] > 0 else 0.0)
            for d in range(7)
        }
        blk.estimated_affected_seconds = accumulated[i]

    return blocks


def _compute_block_detailed_stats(
    blocks: list[BlockAnalysis],
    sorted_msgs: list[TelegramMessage],
    ai_map: dict,
) -> list[BlockAnalysis]:
    """
    Per-block detailed stats derived from AI analyses:
      - monthly_affectations (1..12)
      - hourly_affectations (0..23)
      - severity_breakdown
      - co_occurrences with other blocks (1..6)
      - top_municipalities and top_circuits (top 6 each)
      - worst_day_date + worst_day_events
      - avg_deficit_mw
    """
    from core.classes import BlockTopZone

    # per-block accumulators
    monthly: dict[int, dict[int, int]] = {i: {m: 0 for m in range(1, 13)} for i in range(1, BLOCK_COUNT + 1)}
    hourly: dict[int, dict[int, int]] = {i: {h: 0 for h in range(24)} for i in range(1, BLOCK_COUNT + 1)}
    severity: dict[int, Counter[str]] = {i: Counter() for i in range(1, BLOCK_COUNT + 1)}
    cooc: dict[int, Counter[int]] = {i: Counter() for i in range(1, BLOCK_COUNT + 1)}
    munis: dict[int, Counter[str]] = {i: Counter() for i in range(1, BLOCK_COUNT + 1)}
    circuits: dict[int, Counter[str]] = {i: Counter() for i in range(1, BLOCK_COUNT + 1)}
    daily: dict[int, Counter[str]] = {i: Counter() for i in range(1, BLOCK_COUNT + 1)}
    deficits: dict[int, list[int]] = {i: [] for i in range(1, BLOCK_COUNT + 1)}

    for m in sorted_msgs:
        ai = ai_map.get(m.id)
        if ai is None or ai.ai_failed:
            continue
        affected = [b for b in (ai.affected_blocks or []) if 1 <= b <= BLOCK_COUNT]
        if not affected:
            continue

        date = m.date_cuba_d
        sev = ai.severity or "low"
        deficit = ai.power_deficit_mw

        for b in affected:
            if date is not None:
                monthly[b][date.month] += 1
                hourly[b][date.hour] += 1
                day_key = m.date_cuba[:10] if m.date_cuba else ""
                if day_key:
                    daily[b][day_key] += 1
            severity[b][sev] += 1
            for other in affected:
                if other != b:
                    cooc[b][other] += 1
            for muni in (ai.affected_municipalities or []):
                if muni:
                    munis[b][muni] += 1
            for circ in (ai.mentioned_circuits or []):
                if circ:
                    circuits[b][circ] += 1
            if deficit is not None:
                deficits[b].append(int(deficit))

    for blk in blocks:
        i = blk.number
        blk.monthly_affectations = monthly[i]
        blk.hourly_affectations = hourly[i]
        blk.severity_breakdown = dict(severity[i])
        blk.co_occurrences = dict(cooc[i])
        blk.top_municipalities = [
            BlockTopZone(name=name, count=count) for name, count in munis[i].most_common(6)
        ]
        blk.top_circuits = [
            BlockTopZone(name=name, count=count) for name, count in circuits[i].most_common(6)
        ]
        if daily[i]:
            worst_day, worst_count = daily[i].most_common(1)[0]
            blk.worst_day_date = worst_day
            blk.worst_day_events = worst_count
        if deficits[i]:
            blk.avg_deficit_mw = round(sum(deficits[i]) / len(deficits[i]))

    return blocks