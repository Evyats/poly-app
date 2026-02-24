from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.core.storage import JsonStore

router = APIRouter(prefix="/api/reps", tags=["reps"])
store = JsonStore(
    Path(__file__).resolve().parents[1] / "data" / "reps.json",
    lambda: {
        "tabs": [
            {
                "id": "default",
                "name": "Default",
                "exercises": [],
            }
        ]
    },
)


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


@router.get("/tabs")
def list_tabs() -> dict:
    return store.read()


@router.post("/tabs")
def create_tab(payload: TabCreate) -> dict:
    def updater(data: dict) -> dict:
        data["tabs"].append({"id": uuid4().hex[:8], "name": payload.name.strip(), "exercises": []})
        return data

    return store.update(updater)


@router.patch("/tabs/{tab_id}")
def rename_tab(tab_id: str, payload: TabRename) -> dict:
    def updater(data: dict) -> dict:
        tab = next((t for t in data["tabs"] if t["id"] == tab_id), None)
        if tab is None:
            raise HTTPException(status_code=404, detail="Tab not found")
        tab["name"] = payload.name.strip()
        return data

    return store.update(updater)


@router.delete("/tabs/{tab_id}")
def remove_tab(tab_id: str) -> dict:
    def updater(data: dict) -> dict:
        tabs = data["tabs"]
        idx = next((i for i, t in enumerate(tabs) if t["id"] == tab_id), None)
        if idx is None:
            raise HTTPException(status_code=404, detail="Tab not found")
        tabs.pop(idx)
        if not tabs:
            tabs.append({"id": "default", "name": "Default", "exercises": []})
        return data

    return store.update(updater)


@router.post("/tabs/{tab_id}/exercises")
def add_exercise(tab_id: str, payload: ExerciseCreate) -> dict:
    def updater(data: dict) -> dict:
        tab = next((t for t in data["tabs"] if t["id"] == tab_id), None)
        if tab is None:
            raise HTTPException(status_code=404, detail="Tab not found")
        tab["exercises"].append(
            {
                "id": uuid4().hex[:8],
                "name": payload.name.strip(),
                "reps": 0,
                "step": 1,
            }
        )
        return data

    return store.update(updater)


@router.patch("/tabs/{tab_id}/exercises/{exercise_id}")
def patch_exercise(tab_id: str, exercise_id: str, payload: ExercisePatch) -> dict:
    def updater(data: dict) -> dict:
        tab = next((t for t in data["tabs"] if t["id"] == tab_id), None)
        if tab is None:
            raise HTTPException(status_code=404, detail="Tab not found")
        exercise = next((e for e in tab["exercises"] if e["id"] == exercise_id), None)
        if exercise is None:
            raise HTTPException(status_code=404, detail="Exercise not found")

        if payload.name is not None:
            exercise["name"] = payload.name.strip()
        if payload.reps is not None:
            exercise["reps"] = max(0, payload.reps)
        if payload.step is not None:
            exercise["step"] = max(1, payload.step)
        return data

    return store.update(updater)


@router.post("/tabs/{tab_id}/exercises/{exercise_id}/move")
def move_exercise(tab_id: str, exercise_id: str, payload: MoveRequest) -> dict:
    direction = payload.direction.lower().strip()
    if direction not in {"up", "down"}:
        raise HTTPException(status_code=400, detail="Direction must be 'up' or 'down'")

    def updater(data: dict) -> dict:
        tab = next((t for t in data["tabs"] if t["id"] == tab_id), None)
        if tab is None:
            raise HTTPException(status_code=404, detail="Tab not found")

        exercises = tab["exercises"]
        idx = next((i for i, e in enumerate(exercises) if e["id"] == exercise_id), None)
        if idx is None:
            raise HTTPException(status_code=404, detail="Exercise not found")

        new_idx = idx - 1 if direction == "up" else idx + 1
        if 0 <= new_idx < len(exercises):
            exercises[idx], exercises[new_idx] = exercises[new_idx], exercises[idx]
        return data

    return store.update(updater)


@router.delete("/tabs/{tab_id}/exercises/{exercise_id}")
def delete_exercise(tab_id: str, exercise_id: str) -> dict:
    def updater(data: dict) -> dict:
        tab = next((t for t in data["tabs"] if t["id"] == tab_id), None)
        if tab is None:
            raise HTTPException(status_code=404, detail="Tab not found")

        before = len(tab["exercises"])
        tab["exercises"] = [e for e in tab["exercises"] if e["id"] != exercise_id]
        if len(tab["exercises"]) == before:
            raise HTTPException(status_code=404, detail="Exercise not found")
        return data

    return store.update(updater)
