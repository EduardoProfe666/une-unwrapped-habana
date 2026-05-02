"""
CLI to backfill AI analysis for messages already in the SQLite DB.

Usage:
    python scripts/backfill_ai.py                   # process all pending
    python scripts/backfill_ai.py --year 2024       # only one year
    python scripts/backfill_ai.py --max-messages 200
    python scripts/backfill_ai.py --year 2024 --max-messages 1000

Designed for the workflow_dispatch GitHub Action `backfill-ai.yml`. Logs to stdout
(picked up by GitHub Actions). Returns nonzero on hard failure.
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

# Allow running as `python scripts/backfill_ai.py` from repo root.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def main() -> int:
    parser = argparse.ArgumentParser(description="Backfill AI analysis for stored messages.")
    parser.add_argument(
        "--year",
        type=int,
        default=None,
        help="Restrict to a single year (e.g. 2024). Defaults to all years.",
    )
    parser.add_argument(
        "--max-messages",
        type=int,
        default=None,
        help="Process at most this many messages in this run.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=64,
        help="Inference batch size (default 64).",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logger = logging.getLogger("backfill_ai")

    logger.info(
        "Starting AI backfill (year=%s, max_messages=%s, batch_size=%d)",
        args.year,
        args.max_messages,
        args.batch_size,
    )

    try:
        from core.ai.processor import process_pending_ai_analysis

        stats = process_pending_ai_analysis(
            batch_size=args.batch_size,
            max_messages=args.max_messages,
            year_filter=args.year,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Backfill failed with unrecoverable error: %s", exc)
        return 1

    logger.info("Backfill stats: %s", stats)
    print(
        f"::notice::AI backfill done — processed={stats['processed']} "
        f"failed={stats['failed']} elapsed={stats['elapsed_s']}s"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
