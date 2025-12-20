import datetime
import json
from core.classes import UneAnalysis, TelegramMessageWithCount, TelegramMessage, SENAnalysis, SENFailureAnalysisEvent, \
    BlockAnalysis
from core.database import get_messages_by_year
from dataclasses import asdict
from collections import Counter
import re
from zoneinfo import ZoneInfo

from core.serializers import UneAnalysisEncoder

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