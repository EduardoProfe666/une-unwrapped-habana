from datetime import datetime

from core.analyzer import analyze_data
from core.scrapper import process_latest_messages, process_all_messages
from zoneinfo import ZoneInfo

if __name__ == '__main__':
    first_year = 2022
    years = list(range(first_year, datetime.now(ZoneInfo("America/Havana")).year + 1))

    # Message Retrieving from Telegram
    # process_all_messages()
    process_latest_messages()

    # Data Analysis
    for year in years:
        analyze_data(year)
