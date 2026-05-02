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

MAX_BLOCK_DURATION_SECONDS = 24 * 60 * 60

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