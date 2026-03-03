from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.auth import get_current_user
from backend.core.db import get_db
from backend.core.models import User, WeightEntry

router = APIRouter(prefix="/api/weight", tags=["weight"])


class WeightPayload(BaseModel):
    date: str = Field(min_length=10, max_length=10)
    weight: float = Field(gt=0)


def _entries_payload(db: Session, user_id: int) -> dict:
    entries = list(
        db.scalars(
            select(WeightEntry)
            .where(WeightEntry.user_id == user_id)
            .order_by(WeightEntry.entry_date)
        )
    )
    return {
        "entries": [
            {
                "date": entry.entry_date.isoformat(),
                "weight": entry.weight,
            }
            for entry in entries
        ]
    }


@router.get("/entries")
def list_entries(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    return _entries_payload(db, user.id)


@router.put("/entries")
def upsert_entry(payload: WeightPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    entry_date = date.fromisoformat(payload.date)

    existing = db.scalar(
        select(WeightEntry).where(
            WeightEntry.user_id == user.id,
            WeightEntry.entry_date == entry_date,
        )
    )
    if existing is None:
        db.add(WeightEntry(user_id=user.id, entry_date=entry_date, weight=payload.weight))
    else:
        existing.weight = payload.weight

    db.commit()
    return _entries_payload(db, user.id)


@router.delete("/entries/{entry_date}")
def delete_entry(entry_date: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    target_date = date.fromisoformat(entry_date)
    existing = db.scalar(
        select(WeightEntry).where(
            WeightEntry.user_id == user.id,
            WeightEntry.entry_date == target_date,
        )
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(existing)
    db.commit()
    return _entries_payload(db, user.id)

