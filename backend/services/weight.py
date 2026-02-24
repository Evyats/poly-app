from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.core.storage import JsonStore

router = APIRouter(prefix="/api/weight", tags=["weight"])
store = JsonStore(
    Path(__file__).resolve().parents[1] / "data" / "weight.json",
    lambda: {
        "entries": [
            {"date": "2026-02-16", "weight": 79.9},
            {"date": "2026-02-18", "weight": 79.5},
            {"date": "2026-02-20", "weight": 79.4},
            {"date": "2026-02-22", "weight": 79.0},
            {"date": "2026-02-24", "weight": 78.8},
        ]
    },
)


class WeightEntry(BaseModel):
    date: str = Field(min_length=10, max_length=10)
    weight: float = Field(gt=0)


@router.get("/entries")
def list_entries() -> dict:
    data = store.read()
    data["entries"] = sorted(data["entries"], key=lambda x: x["date"])
    return data


@router.put("/entries")
def upsert_entry(payload: WeightEntry) -> dict:
    def updater(data: dict) -> dict:
        data["entries"] = [e for e in data["entries"] if e["date"] != payload.date]
        data["entries"].append({"date": payload.date, "weight": payload.weight})
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
