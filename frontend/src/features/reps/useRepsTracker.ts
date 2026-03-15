import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import type { Exercise, RepsState } from "../../lib/types";

export type FlatExercise = Exercise & { tabId: string; tabName: string };

export function useRepsTracker() {
  const [data, setData] = useState<RepsState>({ tabs: [] });
  const [activeTabId, setActiveTabId] = useState("all");
  const [newTabName, setNewTabName] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [loading, setLoading] = useState(true);

  const activeTab = data.tabs.find((tab) => tab.id === activeTabId);

  const combinedExercises = useMemo<FlatExercise[]>(
    () =>
      data.tabs.flatMap((tab) =>
        tab.exercises.map((exercise) => ({
          ...exercise,
          tabId: tab.id,
          tabName: tab.name,
        })),
      ),
    [data.tabs],
  );

  async function refresh() {
    const next = await api.get<RepsState>("/api/reps/tabs");
    setData(next);
    if (!next.tabs.some((tab) => tab.id === activeTabId) && next.tabs.length > 0) {
      setActiveTabId(next.tabs[0].id);
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab) setRenameValue(activeTab.name);
  }, [activeTab?.id]);

  async function createTab() {
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
    if (activeTabId === tabId) setActiveTabId(next.tabs[0]?.id ?? "all");
  }

  async function createExercise() {
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

  const listToRender: FlatExercise[] =
    activeTabId === "all"
      ? combinedExercises
      : (activeTab?.exercises ?? []).map((exercise) => ({ ...exercise, tabId: activeTab!.id, tabName: activeTab!.name }));

  return {
    loading,
    data,
    activeTab,
    activeTabId,
    setActiveTabId,
    newTabName,
    setNewTabName,
    newExerciseName,
    setNewExerciseName,
    renameValue,
    setRenameValue,
    combinedExercises,
    listToRender,
    refresh,
    createTab,
    renameTab,
    removeTab,
    createExercise,
    patchExercise,
    moveExercise,
    deleteExercise,
  };
}
