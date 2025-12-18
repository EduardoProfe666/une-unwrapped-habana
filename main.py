from core.analyzer import analyze_data
from dotenv import load_dotenv
import os
from core.scrapper import process_latest_messages, process_all_messages

if __name__ == '__main__':
    # LOAD ENVS
    load_dotenv()
    year = int(os.getenv("YEAR"))

    # Message Retrieving from Telegram
    # process_all_messages()
    # process_latest_messages()

    # Data Analysis
    analyze_data(year)
