import json
from dataclasses import asdict, is_dataclass
from datetime import datetime
from enum import Enum

from core.classes import MessageType


class UneAnalysisEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Enum):
            return obj.value
        if isinstance(obj, MessageType):
            return obj.value
        if is_dataclass(obj):
            return asdict(obj)
        if isinstance(obj, (set, frozenset)):
            return sorted(obj) if all(isinstance(x, (int, float, str)) for x in obj) else list(obj)
        if isinstance(obj, bytes):
            return obj.decode("utf-8", errors="replace")
        return super().default(obj)
