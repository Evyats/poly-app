import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { api } from "../api/client";
import type { Exercise, RepsState } from "../lib/types";

type FlatExercise = Exercise & { tabId: string; tabName: string };

export function RepsTrackerPage() {
  const [data, setData] = useState<RepsState>({ tabs: [] });
  const [activeTabId, setActiveTabId] = useState<string>("all");
  const [newTabName, setNewTabName] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [loading, setLoading] = useState(true);

  const activeTab = data.tabs.find((tab) => tab.id === activeTabId);

  const combinedExercises = useMemo<FlatExercise[]>(() => {
    return data.tabs.flatMap((tab) =>
      tab.exercises.map((exercise) => ({
        ...exercise,
        tabId: tab.id,
        tabName: tab.name,
      })),
    );
  }, [data.tabs]);

  async function refresh() {
    const next = await api.get<RepsState>("/api/reps/tabs");
    setData(next);
    if (!next.tabs.some((t) => t.id === activeTabId) && next.tabs.length > 0) {
      setActiveTabId(next.tabs[0].id);
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab) {
      setRenameValue(activeTab.name);
    }
  }, [activeTab?.id]);

  async function createTab(event: FormEvent) {
    event.preventDefault();
    const name = newTabName.trim();
    if (!name) return;
    const next = await api.post<RepsState>("/api/reps/tabs", { name });
    setData(next);
    setNewTabName("");
    setActiveTabId(next.tabs[next.tabs.length - 1].id);
  }

  async function renameTab() {
    if (!activeTab || !renameValue.trim()) return;
    const next = await api.patch<RepsState>(`/api/reps/tabs/${activeTab.id}`, { name: renameValue.trim() });
    setData(next);
  }

  async function removeTab(tabId: string) {
    const next = await api.delete<RepsState>(`/api/reps/tabs/${tabId}`);
    setData(next);
    if (activeTabId === tabId) {
      setActiveTabId(next.tabs[0]?.id ?? "all");
    }
  }

  async function createExercise(event: FormEvent) {
    event.preventDefault();
    if (!activeTab || !newExerciseName.trim()) return;
    const next = await api.post<RepsState>(`/api/reps/tabs/${activeTab.id}/exercises`, {
      name: newExerciseName.trim(),
    });
    setData(next);
    setNewExerciseName("");
  }

  async function patchExercise(tabId: string, exerciseId: string, patch: Partial<Exercise>) {
    const next = await api.patch<RepsState>(`/api/reps/tabs/${tabId}/exercises/${exerciseId}`, patch);
    setData(next);
  }

  async function moveExercise(tabId: string, exerciseId: string, direction: "up" | "down") {
    const next = await api.post<RepsState>(`/api/reps/tabs/${tabId}/exercises/${exerciseId}/move`, { direction });
    setData(next);
  }

  async function deleteExercise(tabId: string, exerciseId: string) {
    const next = await api.delete<RepsState>(`/api/reps/tabs/${tabId}/exercises/${exerciseId}`);
    setData(next);
  }

  function renderExercise(exercise: FlatExercise, idx: number, total: number) {
    return (
      <li key={`${exercise.tabId}-${exercise.id}`} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold">{exercise.name}</p>
            {activeTabId === "all" && <p className="text-xs text-slate-500">Tab: {exercise.tabName}</p>}
          </div>
          <button
            onClick={() => deleteExercise(exercise.tabId, exercise.id)}
            className="rounded-md bg-rose-600 px-2 py-1 text-xs text-white"
            type="button"
          >
            Delete
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">
            Reps
            <input
              className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-2 py-1"
              type="number"
              min={0}
              value={exercise.reps}
              onChange={(event) => patchExercise(exercise.tabId, exercise.id, { reps: Number(event.target.value) })}
            />
          </label>
          <label className="text-sm">
            Step Size
            <input
              className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-2 py-1"
              type="number"
              min={1}
              value={exercise.step}
              onChange={(event) => patchExercise(exercise.tabId, exercise.id, { step: Number(event.target.value) })}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            onClick={() => patchExercise(exercise.tabId, exercise.id, { reps: Math.max(0, exercise.reps - exercise.step) })}
            type="button"
          >
            - Step
          </button>
          <button
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            onClick={() => patchExercise(exercise.tabId, exercise.id, { reps: exercise.reps + exercise.step })}
            type="button"
          >
            + Step
          </button>
          <button
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            onClick={() => patchExercise(exercise.tabId, exercise.id, { reps: 0 })}
            type="button"
          >
            Reset
          </button>
          <button
            disabled={activeTabId === "all" || idx === 0}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => moveExercise(exercise.tabId, exercise.id, "up")}
            type="button"
          >
            Up
          </button>
          <button
            disabled={activeTabId === "all" || idx === total - 1}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => moveExercise(exercise.tabId, exercise.id, "down")}
            type="button"
          >
            Down
          </button>
        </div>
      </li>
    );
  }

  const listToRender: FlatExercise[] =
    activeTabId === "all"
      ? combinedExercises
      : (activeTab?.exercises ?? []).map((exercise) => ({ ...exercise, tabId: activeTab!.id, tabName: activeTab!.name }));

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Reps Tracker</h1>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
        <form onSubmit={createTab} className="flex gap-2">
          <input
            value={newTabName}
            onChange={(event) => setNewTabName(event.target.value)}
            className="flex-1 rounded-md border border-slate-300 bg-transparent px-3 py-2"
            placeholder="New tab name"
          />
          <button className="rounded-md bg-cyan-600 px-3 py-2 font-medium text-white" type="submit">
            Add Tab
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTabId("all")}
            className={`rounded-full px-3 py-1 ${activeTabId === "all" ? "bg-cyan-600 text-white" : "bg-slate-200 dark:bg-slate-800"}`}
          >
            All
          </button>
          {data.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`rounded-full px-3 py-1 ${activeTabId === tab.id ? "bg-cyan-600 text-white" : "bg-slate-200 dark:bg-slate-800"}`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {activeTab && activeTabId !== "all" && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              Rename selected tab
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="mt-1 rounded-md border border-slate-300 bg-transparent px-3 py-2"
              />
            </label>
            <button type="button" onClick={renameTab} className="rounded-md bg-slate-800 px-3 py-2 text-white dark:bg-slate-200 dark:text-slate-900">
              Rename
            </button>
            <button type="button" onClick={() => removeTab(activeTab.id)} className="rounded-md bg-rose-600 px-3 py-2 text-white">
              Remove Tab
            </button>
          </div>
        )}
      </div>

      {activeTabId !== "all" && (
        <form onSubmit={createExercise} className="flex gap-2">
          <input
            value={newExerciseName}
            onChange={(event) => setNewExerciseName(event.target.value)}
            className="flex-1 rounded-md border border-slate-300 bg-transparent px-3 py-2"
            placeholder="Add exercise name"
          />
          <button className="rounded-md bg-cyan-600 px-3 py-2 font-medium text-white" type="submit">
            Add Exercise
          </button>
        </form>
      )}

      {listToRender.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-400 p-6 text-center text-slate-500">
          No exercises yet. Add one to start tracking reps.
        </p>
      ) : (
        <ul className="space-y-3">{listToRender.map((exercise, idx) => renderExercise(exercise, idx, listToRender.length))}</ul>
      )}
    </section>
  );
}
