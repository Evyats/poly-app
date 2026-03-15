import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import { getTodayDateISO } from "../../lib/date";
import type { WeightEntry } from "../../lib/types";

export type WeightChartPoint = {
  date: string;
  weight: number;
  movingAvg: number;
  trend: number;
};

export function useWeightTracker() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [date, setDate] = useState(getTodayDateISO);
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api.get<{ entries: WeightEntry[] }>("/api/weight/entries");
    setEntries(data.entries);
    if (data.entries.length > 0) {
      const mostRecent = data.entries.reduce((latest, entry) => (entry.date > latest.date ? entry : latest));
      setWeight(String(mostRecent.weight));
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const chartData = useMemo<WeightChartPoint[]>(() => {
    if (entries.length === 0) return [];
    const withAvg = entries.map((entry, idx) => {
      const slice = entries.slice(Math.max(0, idx - 2), idx + 1);
      const movingAvg = slice.reduce((sum, item) => sum + item.weight, 0) / slice.length;
      return { date: entry.date, weight: entry.weight, movingAvg };
    });
    const n = withAvg.length;
    const xMean = (n - 1) / 2;
    const yMean = withAvg.reduce((sum, item) => sum + item.weight, 0) / n;
    const numerator = withAvg.reduce((sum, item, idx) => sum + (idx - xMean) * (item.weight - yMean), 0);
    const denominator = withAvg.reduce((sum, _, idx) => sum + (idx - xMean) ** 2, 0) || 1;
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    return withAvg.map((item, idx) => ({ ...item, trend: intercept + slope * idx }));
  }, [entries]);

  async function saveEntry() {
    const data = await api.put<{ entries: WeightEntry[] }>("/api/weight/entries", {
      date,
      weight: Number(weight),
    });
    setEntries(data.entries);
  }

  return {
    loading,
    entries,
    date,
    setDate,
    weight,
    setWeight,
    chartData,
    saveEntry,
  };
}
