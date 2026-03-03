from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from backend.core.auth import get_current_user
from backend.core.bootstrap import ensure_default_reps_tab
from backend.core.db import get_db
from backend.core.models import RepExercise, RepTab, User

router = APIRouter(prefix="/api/reps", tags=["reps"])


class TabCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class TabRename(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class ExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class ExercisePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=64)
    reps: int | None = None
    step: int | None = None


class MoveRequest(BaseModel):
    direction: str


def _tabs_payload(db: Session, user_id: int) -> dict:
    tabs = list(
        db.scalars(
            select(RepTab)
            .options(selectinload(RepTab.exercises))
            .where(RepTab.user_id == user_id)
            .order_by(RepTab.position)
        )
    )

    payload_tabs: list[dict] = []
    for tab in tabs:
        exercises = sorted(tab.exercises, key=lambda ex: ex.position)
        payload_tabs.append(
            {
                "id": tab.id,
                "name": tab.name,
                "exercises": [
                    {
                        "id": exercise.id,
                        "name": exercise.name,
                        "reps": exercise.reps,
                        "step": exercise.step,
                    }
                    for exercise in exercises
                ],
            }
        )
    return {"tabs": payload_tabs}


@router.get("/tabs")
def list_tabs(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    ensure_default_reps_tab(db, user)
    db.commit()
    return _tabs_payload(db, user.id)


@router.post("/tabs")
def create_tab(
    payload: TabCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    next_position = db.scalar(
        select(func.coalesce(func.max(RepTab.position), -1) + 1).where(RepTab.user_id == user.id)
    )
    db.add(
        RepTab(
            id=uuid4().hex[:8],
            user_id=user.id,
            name=payload.name.strip(),
            position=next_position or 0,
        )
    )
    db.commit()
    return _tabs_payload(db, user.id)


@router.patch("/tabs/{tab_id}")
def rename_tab(
    tab_id: str,
    payload: TabRename,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    tab = db.scalar(select(RepTab).where(RepTab.id == tab_id, RepTab.user_id == user.id))
    if tab is None:
        raise HTTPException(status_code=404, detail="Tab not found")
    tab.name = payload.name.strip()
    db.commit()
    return _tabs_payload(db, user.id)


@router.delete("/tabs/{tab_id}")
def remove_tab(
    tab_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    tab = db.scalar(select(RepTab).where(RepTab.id == tab_id, RepTab.user_id == user.id))
    if tab is None:
        raise HTTPException(status_code=404, detail="Tab not found")
    db.delete(tab)
    db.flush()
    ensure_default_reps_tab(db, user)
    db.commit()
    return _tabs_payload(db, user.id)


@router.post("/tabs/{tab_id}/exercises")
def add_exercise(
    tab_id: str,
    payload: ExerciseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    tab = db.scalar(select(RepTab).where(RepTab.id == tab_id, RepTab.user_id == user.id))
    if tab is None:
        raise HTTPException(status_code=404, detail="Tab not found")

    next_position = db.scalar(
        select(func.coalesce(func.max(RepExercise.position), -1) + 1).where(RepExercise.tab_id == tab.id)
    )
    db.add(
        RepExercise(
            id=uuid4().hex[:8],
            tab_id=tab.id,
            name=payload.name.strip(),
            reps=0,
            step=1,
            position=next_position or 0,
        )
    )
    db.commit()
    return _tabs_payload(db, user.id)


@router.patch("/tabs/{tab_id}/exercises/{exercise_id}")
def patch_exercise(
    tab_id: str,
    exercise_id: str,
    payload: ExercisePatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    tab = db.scalar(select(RepTab).where(RepTab.id == tab_id, RepTab.user_id == user.id))
    if tab is None:
        raise HTTPException(status_code=404, detail="Tab not found")

    exercise = db.scalar(
        select(RepExercise).where(RepExercise.id == exercise_id, RepExercise.tab_id == tab.id)
    )
    if exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not found")

    if payload.name is not None:
        exercise.name = payload.name.strip()
    if payload.reps is not None:
        exercise.reps = max(0, payload.reps)
    if payload.step is not None:
        exercise.step = max(1, payload.step)

    db.commit()
    return _tabs_payload(db, user.id)


@router.post("/tabs/{tab_id}/exercises/{exercise_id}/move")
def move_exercise(
    tab_id: str,
    exercise_id: str,
    payload: MoveRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    direction = payload.direction.lower().strip()
    if direction not in {"up", "down"}:
        raise HTTPException(status_code=400, detail="Direction must be 'up' or 'down'")

    tab = db.scalar(select(RepTab).where(RepTab.id == tab_id, RepTab.user_id == user.id))
    if tab is None:
        raise HTTPException(status_code=404, detail="Tab not found")

    exercises = list(
        db.scalars(select(RepExercise).where(RepExercise.tab_id == tab.id).order_by(RepExercise.position))
    )
    idx = next((i for i, exercise in enumerate(exercises) if exercise.id == exercise_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Exercise not found")

    new_idx = idx - 1 if direction == "up" else idx + 1
    if 0 <= new_idx < len(exercises):
        exercises[idx].position, exercises[new_idx].position = (
            exercises[new_idx].position,
            exercises[idx].position,
        )

    db.commit()
    return _tabs_payload(db, user.id)


@router.delete("/tabs/{tab_id}/exercises/{exercise_id}")
def delete_exercise(
    tab_id: str,
    exercise_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    tab = db.scalar(select(RepTab).where(RepTab.id == tab_id, RepTab.user_id == user.id))
    if tab is None:
        raise HTTPException(status_code=404, detail="Tab not found")

    exercise = db.scalar(
        select(RepExercise).where(RepExercise.id == exercise_id, RepExercise.tab_id == tab.id)
    )
    if exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not found")

    db.delete(exercise)
    db.commit()
    return _tabs_payload(db, user.id)
