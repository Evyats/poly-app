from __future__ import annotations

from datetime import datetime
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.core.storage import JsonStore

router = APIRouter(prefix="/api/routine", tags=["routine"])


def _today() -> str:
    return datetime.now().strftime("%Y-%m-%d")


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


def _default_state() -> dict:
    return {
        "date": _today(),
        "studySeconds": 0,
        "tasks": [
            {
                "id": task["id"],
                "label": task["label"],
                "isTimed": task["isTimed"],
                "initialSeconds": task["initialSeconds"],
                "remainingSeconds": task["initialSeconds"],
                "completed": False,
            }
            for task in DEFAULT_TASKS
        ],
    }


store = JsonStore(
    Path(__file__).resolve().parents[1] / "data" / "routine.json",
    _default_state,
)


class TaskUpdate(BaseModel):
    id: str
    remainingSeconds: int = Field(ge=0)
    completed: bool


class RoutineUpdate(BaseModel):
    studySeconds: int = Field(ge=0)
    tasks: list[TaskUpdate]


@router.get("/today")
def get_today() -> dict:
    def updater(data: dict) -> dict:
        if data.get("date") != _today():
            return _default_state()
        return data

    return store.update(updater)


@router.put("/today")
def put_today(payload: RoutineUpdate) -> dict:
    new_payload = _default_state()
    new_payload["studySeconds"] = payload.studySeconds
    by_id = {task.id: task for task in payload.tasks}
    for task in new_payload["tasks"]:
        incoming = by_id.get(task["id"])
        if incoming:
            task["remainingSeconds"] = incoming.remainingSeconds
            task["completed"] = incoming.completed

    return store.write(new_payload)
