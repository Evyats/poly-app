from __future__ import annotations

from datetime import date, time
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.db import SessionLocal
from backend.core.models import (
    AllowedEmail,
    RepTab,
    RoutineDay,
    RoutineTask,
    User,
    WakeupEntry,
    WeightEntry,
)
from backend.core.settings import ALLOWED_EMAILS, DEFAULT_APP_EMAIL, DEFAULT_APP_USERNAME

WAKEUP_SEED = [
    ("2026-02-18", "07:10"),
    ("2026-02-19", "06:55"),
    ("2026-02-20", "07:25"),
    ("2026-02-21", "08:05"),
    ("2026-02-22", "07:40"),
]
WEIGHT_SEED = [
    ("2026-02-16", 79.9),
    ("2026-02-18", 79.5),
    ("2026-02-20", 79.4),
    ("2026-02-22", 79.0),
    ("2026-02-24", 78.8),
]
DEFAULT_TASKS = [
    {
        "id": "t1",
        "label": "Read high-quality existing GitHub code (20 min)",
        "isTimed": True,
        "initialSeconds": 20 * 60,
    },
    {
        "id": "t2",
        "label": "Use a new AI tool (30 min)",
        "isTimed": True,
        "initialSeconds": 30 * 60,
    },
    {
        "id": "t3",
        "label": "Generate 3 ChatGPT programming questions",
        "isTimed": False,
        "initialSeconds": 0,
    },
    {
        "id": "t4",
        "label": "Commit changes to codebase and push to GitHub",
        "isTimed": False,
        "initialSeconds": 0,
    },
]


def get_or_create_user(
    db: Session,
    *,
    username: str,
    email: str | None = None,
) -> User:
    user = db.scalar(select(User).where(User.username == username))
    if user is None and email:
        user = db.scalar(select(User).where(User.email == email))

    if user is None:
        user = User(username=username, email=email)
        db.add(user)
        db.flush()
    else:
        # Keep configured default email in sync if provided and not used by another user.
        if email and user.email != email:
            clash = db.scalar(select(User).where(User.email == email, User.id != user.id))
            if clash is None:
                user.email = email

    return user


def get_default_user(db: Session) -> User:
    return get_or_create_user(db, username=DEFAULT_APP_USERNAME, email=DEFAULT_APP_EMAIL)


def ensure_default_reps_tab(db: Session, user: User) -> None:
    has_tabs = db.scalar(select(RepTab.id).where(RepTab.user_id == user.id).limit(1))
    if has_tabs is None:
        db.add(RepTab(id=uuid4().hex[:8], user_id=user.id, name="Default", position=0))


def ensure_seed_entries(db: Session, user: User) -> None:
    wake_exists = db.scalar(select(WakeupEntry.id).where(WakeupEntry.user_id == user.id).limit(1))
    if wake_exists is None:
        for dt, tm in WAKEUP_SEED:
            db.add(
                WakeupEntry(
                    user_id=user.id,
                    entry_date=date.fromisoformat(dt),
                    wake_time=time.fromisoformat(tm),
                )
            )

    weight_exists = db.scalar(select(WeightEntry.id).where(WeightEntry.user_id == user.id).limit(1))
    if weight_exists is None:
        for dt, value in WEIGHT_SEED:
            db.add(WeightEntry(user_id=user.id, entry_date=date.fromisoformat(dt), weight=value))


def ensure_routine_day(db: Session, user: User, day: date) -> RoutineDay:
    routine_day = db.scalar(
        select(RoutineDay).where(RoutineDay.user_id == user.id, RoutineDay.entry_date == day)
    )
    if routine_day is None:
        routine_day = RoutineDay(user_id=user.id, entry_date=day, study_seconds=0)
        db.add(routine_day)
        db.flush()

        previous_day = db.scalar(
            select(RoutineDay)
            .where(RoutineDay.user_id == user.id, RoutineDay.entry_date < day)
            .order_by(RoutineDay.entry_date.desc())
        )
        if previous_day is not None:
            previous_tasks = list(
                db.scalars(
                    select(RoutineTask)
                    .where(RoutineTask.routine_day_id == previous_day.id)
                    .order_by(RoutineTask.id)
                )
            )
            seed_tasks = [
                {
                    "id": task.task_id,
                    "label": task.label,
                    "isTimed": task.is_timed,
                    "initialSeconds": task.initial_seconds,
                }
                for task in previous_tasks
            ]
        else:
            seed_tasks = DEFAULT_TASKS

        for task in seed_tasks:
            db.add(
                RoutineTask(
                    routine_day_id=routine_day.id,
                    task_id=task["id"],
                    label=task["label"],
                    is_timed=task["isTimed"],
                    initial_seconds=task["initialSeconds"],
                    remaining_seconds=task["initialSeconds"],
                    completed=False,
                )
            )
        db.flush()
    return routine_day


def seed_allowed_emails(db: Session) -> None:
    normalized = {email.strip().lower() for email in ALLOWED_EMAILS if email.strip()}
    if not normalized:
        return

    existing = set(
        db.scalars(
            select(AllowedEmail.email).where(AllowedEmail.email.in_(normalized))
        )
    )
    for email in normalized - existing:
        db.add(AllowedEmail(email=email, is_active=True))


def seed_default_data() -> None:
    with SessionLocal() as db:
        seed_allowed_emails(db)
        user = get_default_user(db)
        ensure_default_reps_tab(db, user)
        ensure_seed_entries(db, user)
        db.commit()
