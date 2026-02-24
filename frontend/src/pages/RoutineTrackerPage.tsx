import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { formatSeconds } from "../lib/time";
import type { RoutineState, RoutineTask } from "../lib/types";

function playDoneChime() {
  const audioCtx = new AudioContext();
  const now = audioCtx.currentTime;
  const gain = audioCtx.createGain();
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  [523.25, 659.25, 783.99].forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(now + idx * 0.15);
    osc.stop(now + idx * 0.15 + 0.45);
  });
}

export function RoutineTrackerPage() {
  const [studySeconds, setStudySeconds] = useState(0);
  const [studyRunning, setStudyRunning] = useState(false);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [runningByTask, setRunningByTask] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get<RoutineState>("/api/routine/today").then((data) => {
      setStudySeconds(data.studySeconds);
      setTasks(data.tasks);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (studyRunning) {
        setStudySeconds((prev) => prev + 1);
      }

      setTasks((prev) =>
        prev.map((task) => {
          if (!task.isTimed || !runningByTask[task.id] || task.completed) {
            return task;
          }

          const nextRemaining = Math.max(0, task.remainingSeconds - 1);
          if (nextRemaining === 0) {
            playDoneChime();
            setRunningByTask((running) => ({ ...running, [task.id]: false }));
            return { ...task, remainingSeconds: 0, completed: true };
          }
          return { ...task, remainingSeconds: nextRemaining };
        }),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [studyRunning, runningByTask]);

  useEffect(() => {
    if (!tasks.length) return;
    const timeout = setTimeout(() => {
      api.put<RoutineState>("/api/routine/today", {
        studySeconds,
        tasks: tasks.map((task) => ({
          id: task.id,
          remainingSeconds: task.remainingSeconds,
          completed: task.completed,
        })),
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [studySeconds, tasks]);

  const allDone = useMemo(() => tasks.every((task) => task.completed), [tasks]);

  function updateTask(taskId: string, patch: Partial<RoutineTask>) {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
  }

  function handleManualEdit(part: "h" | "m" | "s", value: string) {
    if (studyRunning) return;
    const clamped = Math.max(0, Number(value) || 0);
    const hours = Math.floor(studySeconds / 3600);
    const minutes = Math.floor((studySeconds % 3600) / 60);
    const seconds = studySeconds % 60;

    const nextH = part === "h" ? clamped : hours;
    const nextM = part === "m" ? Math.min(59, clamped) : minutes;
    const nextS = part === "s" ? Math.min(59, clamped) : seconds;

    setStudySeconds(nextH * 3600 + nextM * 60 + nextS);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Daily Routine Tracker</h1>

      <button
        type="button"
        onClick={() => setStudyRunning((v) => !v)}
        className="w-full rounded-2xl border border-cyan-300 bg-cyan-50 p-6 text-center dark:border-cyan-800 dark:bg-cyan-950"
      >
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Study Stopwatch (click to start/pause)</p>
        <p className="mt-2 text-5xl font-black tabular-nums text-cyan-900 dark:text-cyan-100">{formatSeconds(studySeconds)}</p>
      </button>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setStudyRunning((v) => !v)} className="rounded-md bg-cyan-600 px-3 py-2 text-white">
          {studyRunning ? "Pause" : "Start"}
        </button>
        <button type="button" onClick={() => { setStudyRunning(false); setStudySeconds(0); }} className="rounded-md border border-slate-300 px-3 py-2">
          Reset
        </button>
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-3">
        <label className="text-sm">
          Hours
          <input
            disabled={studyRunning}
            type="number"
            min={0}
            className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-2 py-1 disabled:opacity-60"
            value={Math.floor(studySeconds / 3600)}
            onChange={(event) => handleManualEdit("h", event.target.value)}
          />
        </label>
        <label className="text-sm">
          Minutes
          <input
            disabled={studyRunning}
            type="number"
            min={0}
            max={59}
            className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-2 py-1 disabled:opacity-60"
            value={Math.floor((studySeconds % 3600) / 60)}
            onChange={(event) => handleManualEdit("m", event.target.value)}
          />
        </label>
        <label className="text-sm">
          Seconds
          <input
            disabled={studyRunning}
            type="number"
            min={0}
            max={59}
            className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-2 py-1 disabled:opacity-60"
            value={studySeconds % 60}
            onChange={(event) => handleManualEdit("s", event.target.value)}
          />
        </label>
      </div>

      <ul className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(event) => updateTask(task.id, { completed: event.target.checked })}
                />
                <span>{task.label}</span>
              </label>
              {task.isTimed && (
                <p className="font-mono text-lg tabular-nums">{formatSeconds(task.remainingSeconds)}</p>
              )}
            </div>

            {task.isTimed && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRunningByTask((prev) => ({ ...prev, [task.id]: !prev[task.id] }))}
                  className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm text-white"
                >
                  {runningByTask[task.id] ? "Pause" : "Start"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRunningByTask((prev) => ({ ...prev, [task.id]: false }));
                    updateTask(task.id, { remainingSeconds: task.initialSeconds, completed: false });
                  }}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                >
                  Reset
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {allDone && tasks.length > 0 && (
        <p className="rounded-xl border border-emerald-400 bg-emerald-100 p-4 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">
          All daily tasks are completed.
        </p>
      )}
    </section>
  );
}
