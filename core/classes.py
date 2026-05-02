from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum


@dataclass
class TelegramMessage:
    """
    Telegram Message class with all the necessary attributes.

    **Note**: Has a custom `str` method.
    """
    id: int = 0
    link: str = ''
    date_utc: str = ""
    date_utc_d: datetime = None
    date_cuba: str = ""
    date_cuba_d: datetime = None
    reactions: Dict[str, int] = field(default_factory=dict)
    views: int  = 0
    replies: int = 0
    text: str = ""

    def __str__(self):
        reactions_str = "\n".join(f"  {emoji}: {count}" for emoji, count in self.reactions.items())
        return (
            f"ID: {self.id}\n"
            f"Date (UTC): {self.date_utc}\n"
            f"Date (Cuba): {self.date_cuba}\n"
            f"Views: {self.views}\n"
            f"Replies: {self.replies}\n"
            f"Reactions:\n{reactions_str}\n"
            f"Text: {self.text}\n"
            f"{'='*50}"
        )

class MessageType(Enum):
    """
    Message Type enum that describes the different types of messages on UNE channel
    """
    GENERAL_INFORMATION = 1
    DAF = 2
    FAILURE_BY_ZONE = 3
    DAILY_RESUME = 4
    BLOCK_INFORMATION = 5

@dataclass
class TelegramMessageWithCount(TelegramMessage):
    """
    Telegram Message class with all the necessary attributes and a count attribute.
    """
    count: int = 0

@dataclass
class BlockTopZone:
    name: str = ""
    count: int = 0


@dataclass
class BlockAnalysis:
    """
    Block Analysis class with all the necessary attributes.
    """
    number: int = 0
    mentions: int = 0
    declared_recoveries: int = 0
    declared_affectations: int = 0
    declared_emergencies: int = 0
    estimated_affected_seconds: int = 0
    weekday_off_seconds: Dict[int, int] = field(default_factory=dict)
    weekday_off_avg_seconds: Dict[int, float] = field(default_factory=dict)

    # AI-derived detailed stats (compact). Only populated when AI rows exist.
    monthly_affectations: Dict[int, int] = field(default_factory=dict)  # 1..12 → count
    hourly_affectations: Dict[int, int] = field(default_factory=dict)   # 0..23 → count
    severity_breakdown: Dict[str, int] = field(default_factory=dict)    # severity → count
    co_occurrences: Dict[int, int] = field(default_factory=dict)        # other_block → count
    top_municipalities: List[BlockTopZone] = field(default_factory=list)
    top_circuits: List[BlockTopZone] = field(default_factory=list)
    worst_day_date: str = ""
    worst_day_events: int = 0
    avg_deficit_mw: Optional[int] = None  # avg power_deficit_mw across affectations of this block

@dataclass
class SENFailureAnalysisEvent:
    """
    SEN Failure Analysis Event class with all the necessary attributes.
    """
    start_date: str = ""
    start_date_d: datetime = None
    start_message: TelegramMessage = None
    end_date: str = ""
    end_date_d: datetime = None
    end_message: TelegramMessage = None
    estimated_duration_seconds: int = 0

@dataclass
class SENAnalysis:
    """
    SEN Analysis class with all the necessary attributes.
    """
    mentions: int = 0
    total_failure_events: int = 0
    failure_events: list[SENFailureAnalysisEvent] = field(default_factory=list)


# ------------------------- AI ENRICHMENT DATACLASSES ------------------------- #

@dataclass
class MessageAIAnalysis:
    """
    AI-derived analysis for a single Telegram message. Mirrors the
    `message_ai_analysis` SQLite table.
    """
    message_id: int = 0
    category: str = "general_info"
    category_confidence: float = 0.0
    subcategories: List[Dict[str, Any]] = field(default_factory=list)
    sen_status: Optional[str] = None
    affected_blocks: List[int] = field(default_factory=list)
    recovered_blocks: List[int] = field(default_factory=list)
    affected_provinces: List[str] = field(default_factory=list)
    affected_municipalities: List[str] = field(default_factory=list)
    mentioned_circuits: List[str] = field(default_factory=list)
    mentioned_units: List[Dict[str, Any]] = field(default_factory=list)
    power_demand_mw: Optional[int] = None
    power_availability_mw: Optional[int] = None
    power_deficit_mw: Optional[int] = None
    peak_forecast_mw: Optional[int] = None
    mentioned_times: List[Dict[str, Any]] = field(default_factory=list)
    severity: Optional[str] = None
    event_type: Optional[str] = None
    summary: str = ""
    raw_features: Dict[str, Any] = field(default_factory=dict)
    model_version: str = ""
    ai_failed: bool = False
    ai_error: Optional[str] = None
    processed_at: str = ""


# ---- AI ENRICHMENT export-ready dataclasses (compact, JSON-serializable) ---- #


@dataclass
class AffectedZone:
    """Aggregated counts for a province / municipality / circuit."""
    name: str = ""
    kind: str = ""  # province | municipality | circuit
    mentions: int = 0
    affectations: int = 0
    recoveries: int = 0


@dataclass
class PowerPoint:
    """Single point in the power-metrics timeline (date + MW snapshot)."""
    date: str = ""
    demand: Optional[int] = None
    availability: Optional[int] = None
    deficit: Optional[int] = None
    is_forecast: bool = False  # True if from daily_forecast, False from daily_resume


@dataclass
class ThermalPlantStats:
    """Per-CTE stats for the ranking section."""
    canonical: str = ""
    city: str = ""
    mentions: int = 0
    failures: int = 0
    recoveries: int = 0
    monthly_activity: List[int] = field(default_factory=list)  # length 12
    last_status: str = "unknown"  # active_failure | recovering | normal | unknown


@dataclass
class WorstDay:
    """Single worst day of the year by critical-event count."""
    date: str = ""
    critical_events: int = 0
    high_events: int = 0
    affected_blocks_count: int = 0
    deficit_mw: Optional[int] = None
    sample_message_id: int = 0
    sample_summary: str = ""


@dataclass
class CalmestDay:
    """Calmest day of the year — no critical events, ideally also low high events."""
    date: str = ""
    total_events: int = 0
    sample_message_id: int = 0


@dataclass
class YearRecords:
    """Notable streaks and last-event timestamps used by the 'days without blackout' counter."""
    longest_clean_streak_days: int = 0           # mayor racha sin eventos high/critical
    longest_clean_streak_start: str = ""
    longest_clean_streak_end: str = ""
    days_since_sen_failure: Optional[int] = None      # días desde la última desconexión total
    days_since_critical_event: Optional[int] = None   # días desde el último evento critical
    days_since_block_affectation: Optional[int] = None
    last_sen_failure_date: str = ""
    last_critical_event_date: str = ""
    last_block_affectation_date: str = ""


@dataclass
class TopQuote:
    """A simple flattened reference to a top message used as a poster."""
    message_id: int = 0
    text_preview: str = ""   # primeros ~280 chars
    date: str = ""
    views: int = 0
    reactions_total: int = 0
    metric: str = ""         # 'views' | 'reactions' | 'replies' — quién lo coronó como top


@dataclass
class UneAnalysis:
    """
    UNE Analysis class with all the data for UNE-Unwrapped project.
    """

    # GENERAL INFORMATION
    sync_date: datetime = None
    year: int = 0
    first_message: TelegramMessage = None
    last_message: TelegramMessage = None
    shortest_message: TelegramMessageWithCount = None
    longest_message: TelegramMessageWithCount = None

    # TOTALS
    total_views: int = 0
    total_messages: int = 0
    total_erased_messages: int = 0
    total_replies: int = 0
    total_reactions: int = 0
    total_positive_reactions: int = 0
    total_negative_reactions: int = 0

    # AVGs
    avg_views: int = 0
    avg_replies: int = 0
    avg_reactions: int = 0
    avg_positive_reactions: int = 0
    avg_negative_reactions: int = 0
    avg_text_length: int = 0

    # DATES
    monthly_views: Dict[int, int] = field(default_factory=dict)
    monthly_replies: Dict[int, int] = field(default_factory=dict)
    monthly_reactions: Dict[int, int] = field(default_factory=dict)
    monthly_messages: Dict[int, int] = field(default_factory=dict)
    daily_messages: Dict[int, int] = field(default_factory=dict)

    # DISTRIBUTIONS
    distribution_message: Dict[int, int] = field(default_factory=dict)
    distribution_reaction: Dict[str, int] = field(default_factory=dict)

    # TOPs
    top3_most_viewed_messages: list[TelegramMessageWithCount] = field(default_factory=list)
    top3_most_replied_messages: list[TelegramMessageWithCount] = field(default_factory=list)
    top3_most_positive_reaction_messages: list[TelegramMessageWithCount] = field(default_factory=list)
    top3_most_negative_reaction_messages: list[TelegramMessageWithCount] = field(default_factory=list)
    top25_most_repeated_words: Dict[str, int] = field(default_factory=dict)

    # EXTRA ANALYSIS
    blocks_analysis: list[BlockAnalysis] = field(default_factory=list)
    sen_analysis: SENAnalysis = None

    # AI ENRICHMENT — compact additive sections, populated by `__apply_ai_enrichment`
    # when the `message_ai_analysis` table has rows for this year. Defaults preserve
    # backwards compatibility (the frontend tolerates them being empty/null).
    ai_categories_distribution: Dict[str, int] = field(default_factory=dict)
    affected_zones: List[AffectedZone] = field(default_factory=list)
    daily_severity: Dict[int, str] = field(default_factory=dict)  # day-of-year → severity
    power_timeline: List[PowerPoint] = field(default_factory=list)
    thermal_units: List[ThermalPlantStats] = field(default_factory=list)
    hour_of_day_severity: Dict[int, int] = field(default_factory=dict)  # 0..23 → critical+high count
    worst_day: Optional[WorstDay] = None
    live_grid_status: str = "unknown"  # last-known sen_status in the year

    # ---- New Wrapped-style sections (additive, all optional) ----
    calmest_day: Optional[CalmestDay] = None
    year_records: Optional[YearRecords] = None
    health_score: int = 0  # 0..100 — overall grid health
    health_breakdown: Dict[str, int] = field(default_factory=dict)  # components feeding the score
    avg_ai_confidence: float = 0.0  # mean classifier confidence
    weekly_hourly_severity: Dict[str, int] = field(default_factory=dict)  # "wd-hour" e.g. "0-18" → count of high+critical
    ai_categories_monthly: Dict[str, List[int]] = field(default_factory=dict)  # category → 12 monthly counts
    sentiment_monthly: Dict[int, float] = field(default_factory=dict)  # month → ratio negativas / totales (0..1)
    top_quotes: List[TopQuote] = field(default_factory=list)
    blackout_probability_now: int = 0  # 0..100 — for the "predictor" widget at this weekday/hour
