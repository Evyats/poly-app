from __future__ import annotations

from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from backend.core.auth import get_current_user
from backend.core.bootstrap import WAKEUP_SEED
from backend.core.db import get_db
from backend.core.models import User, WakeupEntry

router = APIRouter(prefix="/api/wakeup", tags=["wakeup"])


class WakeupPayload(BaseModel):
    date: str = Field(min_length=10, max_length=10)
    time: str = Field(min_length=5, max_length=5)


def _entries_payload(db: Session, user_id: int) -> dict:
    entries = list(
        db.scalars(
            select(WakeupEntry)
            .where(WakeupEntry.user_id == user_id)
            .order_by(WakeupEntry.entry_date)
        )
    )
    return {
        "entries": [
            {
                "date": entry.entry_date.isoformat(),
                "time": entry.wake_time.strftime("%H:%M"),
            }
            for entry in entries
        ]
    }


@router.get("/entries")
def list_entries(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    return _entries_payload(db, user.id)


@router.put("/entries")
def upsert_entry(payload: WakeupPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    entry_date = date.fromisoformat(payload.date)
    wake_time = time.fromisoformat(payload.time)

    existing = db.scalar(
        select(WakeupEntry).where(
            WakeupEntry.user_id == user.id,
            WakeupEntry.entry_date == entry_date,
        )
    )
    if existing is None:
        db.add(WakeupEntry(user_id=user.id, entry_date=entry_date, wake_time=wake_time))
    else:
        existing.wake_time = wake_time

    db.commit()
    return _entries_payload(db, user.id)


@router.delete("/entries/{entry_date}")
def delete_entry(entry_date: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    target_date = date.fromisoformat(entry_date)
    existing = db.scalar(
        select(WakeupEntry).where(
            WakeupEntry.user_id == user.id,
            WakeupEntry.entry_date == target_date,
        )
    )
    if existing is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(existing)
    db.commit()
    return _entries_payload(db, user.id)


@router.post("/reset")
def reset_entries(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    db.execute(delete(WakeupEntry).where(WakeupEntry.user_id == user.id))
    for dt, tm in WAKEUP_SEED:
        db.add(
            WakeupEntry(
                user_id=user.id,
                entry_date=date.fromisoformat(dt),
                wake_time=time.fromisoformat(tm),
            )
        )
    db.commit()
    return _entries_payload(db, user.id)

