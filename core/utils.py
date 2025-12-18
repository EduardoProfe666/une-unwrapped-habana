import datetime

def datestr_to_datetime(datestr):
    """
    Convert a date string to datetime object.
    Format must be yyyy-mm-dd HH:MM:SS

    :param datestr: Date string to convert.
    :return: Datetime object.
    """
    return datetime.datetime.strptime(datestr, "%Y-%m-%d %H:%M:%S")