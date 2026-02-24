from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any, Callable


class JsonStore:
    def __init__(self, path: Path, default_factory: Callable[[], dict[str, Any]]) -> None:
        self.path = path
        self.default_factory = default_factory
        self._lock = Lock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self._write_unlocked(self.default_factory())

    def read(self) -> dict[str, Any]:
        with self._lock:
            with self.path.open("r", encoding="utf-8") as fp:
                return json.load(fp)

    def write(self, payload: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._write_unlocked(payload)
        return payload

    def update(self, updater: Callable[[dict[str, Any]], dict[str, Any]]) -> dict[str, Any]:
        with self._lock:
            with self.path.open("r", encoding="utf-8") as fp:
                data = json.load(fp)
            updated = updater(data)
            self._write_unlocked(updated)
            return updated

    def _write_unlocked(self, payload: dict[str, Any]) -> None:
        with self.path.open("w", encoding="utf-8") as fp:
            json.dump(payload, fp, indent=2)
