from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.auth import get_current_user
from backend.core.bootstrap import DEFAULT_TASKS, ensure_routine_day
from backend.core.db import get_db
from backend.core.models import RoutineTask, User

router = APIRouter(prefix="/api/routine", tags=["routine"])


class TaskUpdate(BaseModel):
    id: str
    remainingSeconds: int = Field(ge=0)
    completed: bool


class RoutineUpdate(BaseModel):
    studySeconds: int = Field(ge=0)
    tasks: list[TaskUpdate]


def _day_payload(db: Session, user: User, target_day: date) -> dict:
    routine_day = ensure_routine_day(db, user, target_day)

    tasks = list(
        db.scalars(
            select(RoutineTask)
            .where(RoutineTask.routine_day_id == routine_day.id)
            .order_by(RoutineTask.task_id)
        )
    )

    task_by_id = {task.task_id: task for task in tasks}
    ordered = [task_by_id.get(definition["id"]) for definition in DEFAULT_TASKS]

    return {
        "date": routine_day.entry_date.isoformat(),
        "studySeconds": routine_day.study_seconds,
        "tasks": [
            {
                "id": task.task_id,
                "label": task.label,
                "isTimed": task.is_timed,
                "initialSeconds": task.initial_seconds,
                "remainingSeconds": task.remaining_seconds,
                "completed": task.completed,
            }
            for task in ordered
            if task is not None
        ],
    }


@router.get("/today")
def get_today(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    payload = _day_payload(db, user, date.today())
    db.commit()
    return payload


@router.put("/today")
def put_today(payload: RoutineUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    today = date.today()
    routine_day = ensure_routine_day(db, user, today)
    routine_day.study_seconds = payload.studySeconds

    by_id = {item.id: item for item in payload.tasks}
    tasks = list(db.scalars(select(RoutineTask).where(RoutineTask.routine_day_id == routine_day.id)))
    for task in tasks:
        incoming = by_id.get(task.task_id)
        if incoming is not None:
            task.remaining_seconds = incoming.remainingSeconds
            task.completed = incoming.completed

    db.commit()
    return _day_payload(db, user, today)

