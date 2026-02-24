from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.core.storage import JsonStore

router = APIRouter(prefix="/api/wakeup", tags=["wakeup"])
SEED_ENTRIES = [
    {"date": "2026-02-18", "time": "07:10"},
    {"date": "2026-02-19", "time": "06:55"},
    {"date": "2026-02-20", "time": "07:25"},
    {"date": "2026-02-21", "time": "08:05"},
    {"date": "2026-02-22", "time": "07:40"},
]
store = JsonStore(
    Path(__file__).resolve().parents[1] / "data" / "wakeup.json",
    lambda: {"entries": SEED_ENTRIES.copy()},
)


class WakeupEntry(BaseModel):
    date: str = Field(min_length=10, max_length=10)
    time: str = Field(min_length=5, max_length=5)


@router.get("/entries")
def list_entries() -> dict:
    data = store.read()
    data["entries"] = sorted(data["entries"], key=lambda x: x["date"])
    return data


@router.put("/entries")
def upsert_entry(payload: WakeupEntry) -> dict:
    def updater(data: dict) -> dict:
        data["entries"] = [e for e in data["entries"] if e["date"] != payload.date]
        data["entries"].append({"date": payload.date, "time": payload.time})
        return data

    return store.update(updater)


@router.delete("/entries/{date}")
def delete_entry(date: str) -> dict:
    def updater(data: dict) -> dict:
        before = len(data["entries"])
        data["entries"] = [e for e in data["entries"] if e["date"] != date]
        if len(data["entries"]) == before:
            raise HTTPException(status_code=404, detail="Entry not found")
        return data

    return store.update(updater)


@router.post("/reset")
def reset_entries() -> dict:
    return store.write({"entries": SEED_ENTRIES.copy()})
