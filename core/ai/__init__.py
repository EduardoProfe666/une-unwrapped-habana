"""
AI processing layer for UNE Telegram messages.

Loads HuggingFace models locally (ONNX int8 quantized) to:
- Classify messages into ~15 rich categories (zero-shot mDeBERTa).
- Extract entities (BETO NER) and structured metadata (regex + gazetteer).
- Persist results into the `message_ai_analysis` table.
- Feed the analyzer with enrichment data for the yearly JSONs.
"""

from core.ai.taxonomy import (
    CATEGORIES,
    CATEGORY_TO_EVENT_TYPE,
    DEFAULT_CONFIDENCE_THRESHOLD,
    EVENT_TYPES,
    SEN_STATUSES,
    SEVERITY_LEVELS,
)

MODEL_VERSION = "v1.0.0"


def process_pending_ai_analysis(
    batch_size: int = 64,
    max_messages: int | None = None,
    year_filter: int | None = None,
) -> dict:
    """
    Lazy import of the orchestrator to avoid importing heavy ML deps at module load time.
    """
    from core.ai.processor import process_pending_ai_analysis as _impl

    return _impl(
        batch_size=batch_size,
        max_messages=max_messages,
        year_filter=year_filter,
    )


__all__ = [
    "MODEL_VERSION",
    "CATEGORIES",
    "CATEGORY_TO_EVENT_TYPE",
    "DEFAULT_CONFIDENCE_THRESHOLD",
    "EVENT_TYPES",
    "SEN_STATUSES",
    "SEVERITY_LEVELS",
    "process_pending_ai_analysis",
]
