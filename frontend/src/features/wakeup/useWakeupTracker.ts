import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import { getCurrentTimeHHMM, getTodayDateISO } from "../../lib/date";
import { fromMinuteOfDay, toMinuteOfDay } from "../../lib/time";
import type { WakeupEntry } from "../../lib/types";

export type WakeupFilterMode = "all" | "month" | "year";

export function useWakeupTracker() {
  const [entries, setEntries] = useState<WakeupEntry[]>([]);
  const [date, setDate] = useState(getTodayDateISO);
  const [time, setTime] = useState(getCurrentTimeHHMM);
  const [filterMode, setFilterMode] = useState<WakeupFilterMode>("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [manualYCap, setManualYCap] = useState("");
  const [useAutoCap, setUseAutoCap] = useState(true);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api.get<{ entries: WakeupEntry[] }>("/api/wakeup/entries");
    setEntries(data.entries);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => Array.from(new Set(entries.map((entry) => entry.date.slice(0, 7)))), [entries]);
  const years = useMemo(() => Array.from(new Set(entries.map((entry) => entry.date.slice(0, 4)))), [entries]);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        if (filterMode === "month" && monthFilter) return entry.date.startsWith(monthFilter);
        if (filterMode === "year" && yearFilter) return entry.date.startsWith(yearFilter);
        return true;
      }),
    [entries, filterMode, monthFilter, yearFilter],
  );

  const chartData = useMemo(
    () =>
      filtered.map((entry) => ({
        date: entry.date,
        wake: toMinuteOfDay(entry.time),
      })),
    [filtered],
  );

  const yMax = useMemo(() => {
    const computedMax = Math.max(...chartData.map((item) => item.wake), 7 * 60);
    return useAutoCap ? Math.min(1439, computedMax + 30) : Math.max(1, Number(manualYCap) || 1);
  }, [chartData, manualYCap, useAutoCap]);

  const averageWake = useMemo(() => {
    if (filtered.length === 0) return "--:--";
    const average = Math.round(filtered.reduce((sum, item) => sum + toMinuteOfDay(item.time), 0) / filtered.length);
    return fromMinuteOfDay(average);
  }, [filtered]);

  async function saveEntry() {
    const data = await api.put<{ entries: WakeupEntry[] }>("/api/wakeup/entries", { date, time });
    setEntries(data.entries);
    setSelectedDate(null);
  }

  async function resetEntries() {
    const data = await api.post<{ entries: WakeupEntry[] }>("/api/wakeup/reset");
    setEntries(data.entries);
    setSelectedDate(null);
  }

  async function deleteSelected() {
    if (!selectedDate) return;
    const data = await api.delete<{ entries: WakeupEntry[] }>(`/api/wakeup/entries/${selectedDate}`);
    setEntries(data.entries);
    setSelectedDate(null);
  }

  return {
    loading,
    entries,
    date,
    setDate,
    time,
    setTime,
    filterMode,
    setFilterMode,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    selectedDate,
    setSelectedDate,
    manualYCap,
    setManualYCap,
    useAutoCap,
    setUseAutoCap,
    months,
    years,
    filtered,
    chartData,
    yMax,
    averageWake,
    saveEntry,
    resetEntries,
    deleteSelected,
  };
}
