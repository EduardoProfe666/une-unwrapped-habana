from core import *

if __name__ == '__main__':
    # Message Retrieving from Telegram
    # process_all_messages()
    process_latest_messages()

    # Data Analysis
    first_year, last_year = get_year_range()
    years = list(range(first_year, last_year + 1))
    for year in years:
        analyze_data(year)
