import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../api/client";
import { fromMinuteOfDay, toMinuteOfDay } from "../lib/time";
import type { WakeupEntry } from "../lib/types";

type FilterMode = "all" | "month" | "year";

function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getNowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function WakeupTrackerPage() {
  const [entries, setEntries] = useState<WakeupEntry[]>([]);
  const [date, setDate] = useState(getTodayDate);
  const [time, setTime] = useState(getNowTime);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [manualYCap, setManualYCap] = useState<string>("");
  const [useAutoCap, setUseAutoCap] = useState(true);

  async function load() {
    const data = await api.get<{ entries: WakeupEntry[] }>("/api/wakeup/entries");
    setEntries(data.entries);
  }

  useEffect(() => {
    load();
  }, []);

  const months = useMemo(() => Array.from(new Set(entries.map((e) => e.date.slice(0, 7)))), [entries]);
  const years = useMemo(() => Array.from(new Set(entries.map((e) => e.date.slice(0, 4)))), [entries]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (filterMode === "month" && monthFilter) return entry.date.startsWith(monthFilter);
      if (filterMode === "year" && yearFilter) return entry.date.startsWith(yearFilter);
      return true;
    });
  }, [entries, filterMode, monthFilter, yearFilter]);

  const chartData = filtered.map((entry) => ({
    date: entry.date,
    value: toMinuteOfDay(entry.time),
  }));

  const computedMax = Math.max(...chartData.map((item) => item.value), 7 * 60);
  const yMax = useAutoCap ? Math.min(1439, computedMax + 30) : Math.max(1, Number(manualYCap) || 1);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!date) return;
    const data = await api.put<{ entries: WakeupEntry[] }>("/api/wakeup/entries", { date, time });
    setEntries(data.entries);
    setSelectedDate(null);
  }

  async function resetSeed() {
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

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Wake-up Tracker</h1>

      <form onSubmit={submit} className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-3">
        <label className="text-sm">
          Date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2"
            required
          />
        </label>
        <label className="text-sm">
          Wake-up time
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2"
            required
          />
        </label>
        <button type="submit" className="rounded-md bg-cyan-600 px-3 py-2 font-medium text-white sm:self-end">
          Save/Replace Entry
        </button>
      </form>

      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-4">
        <label className="text-sm">
          Filter
          <select
            value={filterMode}
            onChange={(event) => setFilterMode(event.target.value as FilterMode)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2"
          >
            <option value="all">All</option>
            <option value="month">By Month</option>
            <option value="year">By Year</option>
          </select>
        </label>

        {filterMode === "month" && (
          <label className="text-sm">
            Month
            <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2">
              <option value="">Select month</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        )}

        {filterMode === "year" && (
          <label className="text-sm">
            Year
            <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2">
              <option value="">Select year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="text-sm">
          Y-axis max (minutes)
          <input
            type="number"
            min={1}
            max={1439}
            value={manualYCap}
            disabled={useAutoCap}
            onChange={(event) => setManualYCap(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 disabled:opacity-60"
          />
        </label>

        <div className="flex flex-wrap items-end gap-2">
          <button type="button" onClick={() => setUseAutoCap((v) => !v)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {useAutoCap ? "Use Manual Cap" : "Auto Cap"}
          </button>
          <button type="button" onClick={() => { setUseAutoCap(true); setManualYCap(""); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            Reset Cap
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-400 p-6 text-center text-slate-500">No wake-up data yet. Add your first entry above.</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-2 text-sm text-slate-500">Click a point to select it for deletion.</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, yMax]} tickFormatter={(value) => fromMinuteOfDay(value)} />
                <Tooltip formatter={(value) => fromMinuteOfDay(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0891b2"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx = 0, cy = 0, payload } = props;
                    const isSelected = selectedDate === payload.date;
                    return (
                      <Dot
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 6 : 4}
                        fill={isSelected ? "#dc2626" : "#0891b2"}
                        stroke="#fff"
                        onClick={() => setSelectedDate(payload.date)}
                        style={{ cursor: "pointer" }}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={deleteSelected}
          disabled={!selectedDate}
          className="rounded-md bg-rose-600 px-3 py-2 text-white disabled:opacity-50"
        >
          Delete Selected Point
        </button>
        <button type="button" onClick={resetSeed} className="rounded-md border border-slate-300 px-3 py-2">
          Reset to Seed Data
        </button>
        {selectedDate && <p className="self-center text-sm text-slate-500">Selected: {selectedDate}</p>}
      </div>
    </section>
  );
}
