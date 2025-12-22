from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict
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
    views: int = 0
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
