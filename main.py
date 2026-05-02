import logging

from core import *

if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logger = logging.getLogger("main")

    # Message Retrieving from Telegram
    # process_all_messages()
    process_latest_messages()

    # AI Analysis (incremental — caps at 200 msgs/run to respect the hourly cron SLA;
    # historical backfill is handled by .github/workflows/backfill-ai.yml)
    try:
        ai_stats = process_pending_ai_analysis(max_messages=200)
        logger.info("AI incremental processing stats: %s", ai_stats)
    except Exception as e:
        logger.warning("AI incremental processing failed; continuing with analyzer. Error: %s", e)

    # Data Analysis
    first_year, last_year = get_year_range()
    years = list(range(first_year, last_year + 1))
    for year in years:
        analyze_data(year)
