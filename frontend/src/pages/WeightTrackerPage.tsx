import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { api } from "../api/client";
import type { WeightEntry } from "../lib/types";

type WeightChartPoint = {
  date: string;
  weight: number;
  movingAvg: number;
  trend: number;
};

export function WeightTrackerPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");

  async function load() {
    const data = await api.get<{ entries: WeightEntry[] }>("/api/weight/entries");
    setEntries(data.entries);
  }

  useEffect(() => {
    load();
  }, []);

  const chartData = useMemo<WeightChartPoint[]>(() => {
    if (entries.length === 0) return [];

    const withAvg = entries.map((entry, idx) => {
      const slice = entries.slice(Math.max(0, idx - 2), idx + 1);
      const movingAvg = slice.reduce((sum, item) => sum + item.weight, 0) / slice.length;
      return {
        date: entry.date,
        weight: entry.weight,
        movingAvg,
      };
    });

    const n = withAvg.length;
    const xMean = (n - 1) / 2;
    const yMean = withAvg.reduce((sum, item) => sum + item.weight, 0) / n;
    const numerator = withAvg.reduce((sum, item, idx) => sum + (idx - xMean) * (item.weight - yMean), 0);
    const denominator = withAvg.reduce((sum, _, idx) => sum + (idx - xMean) ** 2, 0) || 1;
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    return withAvg.map((item, idx) => ({
      ...item,
      trend: intercept + slope * idx,
    }));
  }, [entries]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!date || !weight) return;
    const data = await api.put<{ entries: WeightEntry[] }>("/api/weight/entries", {
      date,
      weight: Number(weight),
    });
    setEntries(data.entries);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Weight Tracker</h1>

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
          Weight
          <input
            type="number"
            min={1}
            step="0.1"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2"
            required
          />
        </label>
        <button type="submit" className="rounded-md bg-cyan-600 px-3 py-2 font-medium text-white sm:self-end">
          Save/Replace Entry
        </button>
      </form>

      {chartData.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-400 p-6 text-center text-slate-500">No weight data yet. Add your first entry.</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#0369a1" strokeWidth={2} name="Raw" />
                <Line type="monotone" dataKey="movingAvg" stroke="#16a34a" strokeWidth={2} name="Moving Avg" />
                <Line type="monotone" dataKey="trend" stroke="#dc2626" strokeWidth={2} dot={false} name="Trend" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
