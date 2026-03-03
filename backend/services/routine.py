from __future__ import annotations

from datetime import date
from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.auth import get_current_user
from backend.core.bootstrap import ensure_routine_day
from backend.core.db import get_db
from backend.core.models import RoutineTask, User

router = APIRouter(prefix="/api/routine", tags=["routine"])


class TaskUpdate(BaseModel):
    id: str | None = None
    label: str = Field(min_length=1, max_length=255)
    isTimed: bool
    initialSeconds: int = Field(ge=0)
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
            .order_by(RoutineTask.id)
        )
    )

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
            for task in tasks
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

    existing_tasks = list(db.scalars(select(RoutineTask).where(RoutineTask.routine_day_id == routine_day.id)))
    existing_by_id = {task.task_id: task for task in existing_tasks}
    keep_ids: set[str] = set()

    for incoming in payload.tasks:
        task_id = incoming.id or uuid4().hex[:8]
        task = existing_by_id.get(task_id)
        if task is None:
            task = RoutineTask(routine_day_id=routine_day.id, task_id=task_id)
            db.add(task)

        task.label = incoming.label.strip()
        task.is_timed = incoming.isTimed
        task.initial_seconds = max(0, incoming.initialSeconds)
        task.remaining_seconds = max(0, incoming.remainingSeconds)
        task.completed = incoming.completed
        keep_ids.add(task_id)

    for task in existing_tasks:
        if task.task_id not in keep_ids:
            db.delete(task)

    db.commit()
    return _day_payload(db, user, today)

