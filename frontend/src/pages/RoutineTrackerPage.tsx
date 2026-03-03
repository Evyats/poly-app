import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { formatCentiseconds, formatSeconds } from "../lib/time";
import type { RoutineState, RoutineTask } from "../lib/types";

function generateTaskId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 8);
}

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
  const [studyCentiseconds, setStudyCentiseconds] = useState(0);
  const [studyRunning, setStudyRunning] = useState(false);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [runningByTask, setRunningByTask] = useState<Record<string, boolean>>({});
  const [editingTaskIds, setEditingTaskIds] = useState<Set<string>>(new Set());

  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskTimed, setNewTaskTimed] = useState(false);
  const [newTaskMinutes, setNewTaskMinutes] = useState(5);

  useEffect(() => {
    api.get<RoutineState>("/api/routine/today").then((data) => {
      setStudyCentiseconds(data.studySeconds * 100);
      setTasks(data.tasks);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (studyRunning) {
        setStudyCentiseconds((prev) => prev + 1);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [studyRunning]);

  useEffect(() => {
    const timer = setInterval(() => {
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
  }, [runningByTask]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      api.put<RoutineState>("/api/routine/today", {
        studySeconds: Math.floor(studyCentiseconds / 100),
        tasks: tasks.map((task) => ({
          id: task.id,
          label: task.label,
          isTimed: task.isTimed,
          initialSeconds: task.initialSeconds,
          remainingSeconds: task.remainingSeconds,
          completed: task.completed,
        })),
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [studyCentiseconds, tasks]);

  const allDone = useMemo(() => tasks.length > 0 && tasks.every((task) => task.completed), [tasks]);

  function updateTask(taskId: string, patch: Partial<RoutineTask>) {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
  }

  function removeTask(taskId: string) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setEditingTaskIds((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
    setRunningByTask((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }

  function addTask() {
    const label = newTaskLabel.trim();
    if (!label) return;

    const initialSeconds = newTaskTimed ? Math.max(0, Math.floor(newTaskMinutes * 60)) : 0;
    const id = generateTaskId();
    setTasks((prev) => [
      ...prev,
      {
        id,
        label,
        isTimed: newTaskTimed,
        initialSeconds,
        remainingSeconds: initialSeconds,
        completed: false,
      },
    ]);
    setNewTaskLabel("");
    setNewTaskTimed(false);
    setNewTaskMinutes(5);
  }

  function moveTask(taskId: string, direction: "up" | "down") {
    setTasks((prev) => {
      const index = prev.findIndex((task) => task.id === taskId);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;

      const next = [...prev];
      const swapWith = direction === "up" ? index - 1 : index + 1;
      const temp = next[index];
      next[index] = next[swapWith];
      next[swapWith] = temp;
      return next;
    });
  }

  function handleManualEdit(part: "h" | "m" | "s", value: string) {
    if (studyRunning) return;
    const clamped = Math.max(0, Number(value) || 0);
    const totalSeconds = Math.floor(studyCentiseconds / 100);
    const hundredths = studyCentiseconds % 100;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const nextH = part === "h" ? clamped : hours;
    const nextM = part === "m" ? Math.min(59, clamped) : minutes;
    const nextS = part === "s" ? Math.min(59, clamped) : seconds;

    setStudyCentiseconds((nextH * 3600 + nextM * 60 + nextS) * 100 + hundredths);
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
        <p className="mt-2 text-5xl font-black tabular-nums text-cyan-900 dark:text-cyan-100">{formatCentiseconds(studyCentiseconds)}</p>
      </button>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setStudyRunning((v) => !v)} className="rounded-md bg-cyan-600 px-3 py-2 text-white">
          {studyRunning ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStudyRunning(false);
            setStudyCentiseconds(0);
          }}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
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
            value={Math.floor(studyCentiseconds / 100 / 3600)}
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
            value={Math.floor((Math.floor(studyCentiseconds / 100) % 3600) / 60)}
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
            value={Math.floor(studyCentiseconds / 100) % 60}
            onChange={(event) => handleManualEdit("s", event.target.value)}
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold">Tasks</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-4">
          <input
            value={newTaskLabel}
            onChange={(event) => setNewTaskLabel(event.target.value)}
            placeholder="Task label"
            className="rounded-md border border-slate-300 bg-transparent px-2 py-1.5 sm:col-span-2"
          />
          <label className="flex items-center gap-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <input type="checkbox" checked={newTaskTimed} onChange={(event) => setNewTaskTimed(event.target.checked)} />
            Timed
          </label>
          <label className="text-sm">
            Duration (minutes)
            <input
              type="number"
              min={1}
              disabled={!newTaskTimed}
              value={newTaskMinutes}
              onChange={(event) => setNewTaskMinutes(Number(event.target.value) || 1)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-2 py-1.5 disabled:opacity-60"
            />
          </label>
          <button type="button" onClick={addTask} className="rounded-md bg-cyan-600 px-3 py-1.5 text-white sm:col-span-4">
            Add Task
          </button>
        </div>

        <ul className="space-y-3">
          {tasks.map((task, idx) => (
            <li key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="grid gap-2 sm:grid-cols-12">
                <label className="flex items-center gap-2 sm:col-span-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(event) => updateTask(task.id, { completed: event.target.checked })}
                  />
                </label>
                {editingTaskIds.has(task.id) ? (
                  <>
                    <input
                      value={task.label}
                      onChange={(event) => updateTask(task.id, { label: event.target.value })}
                      className="rounded-md border border-slate-300 bg-transparent px-2 py-1.5 sm:col-span-5"
                    />
                    <label className="flex items-center gap-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={task.isTimed}
                        onChange={(event) => {
                          const nextTimed = event.target.checked;
                          updateTask(task.id, {
                            isTimed: nextTimed,
                            initialSeconds: nextTimed ? Math.max(task.initialSeconds, 60) : 0,
                            remainingSeconds: nextTimed ? Math.max(task.remainingSeconds, 60) : 0,
                          });
                        }}
                      />
                      Timed
                    </label>
                    <input
                      type="number"
                      min={1}
                      disabled={!task.isTimed}
                      value={Math.max(1, Math.floor(task.initialSeconds / 60) || 1)}
                      onChange={(event) => {
                        const minutes = Math.max(1, Number(event.target.value) || 1);
                        updateTask(task.id, {
                          initialSeconds: minutes * 60,
                          remainingSeconds: minutes * 60,
                          completed: false,
                        });
                      }}
                      className="rounded-md border border-slate-300 bg-transparent px-2 py-1.5 disabled:opacity-60 sm:col-span-2"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTaskIds((prev) => {
                          const next = new Set(prev);
                          next.delete(task.id);
                          return next;
                        })
                      }
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs sm:col-span-1"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="rounded-md bg-rose-600 px-2 py-1.5 text-xs text-white sm:col-span-1"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTask(task.id, "up")}
                      disabled={idx === 0}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs disabled:opacity-50 sm:col-span-1"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTask(task.id, "down")}
                      disabled={idx === tasks.length - 1}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs disabled:opacity-50 sm:col-span-1"
                    >
                      Down
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-md border border-slate-300 bg-transparent px-2 py-1.5 sm:col-span-5">
                      {task.label}
                    </div>
                    <div className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2">
                      {task.isTimed ? "Timed" : "Not timed"}
                    </div>
                    <div className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2">
                      {task.isTimed ? `${Math.max(1, Math.floor(task.initialSeconds / 60) || 1)} min` : "-"}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTaskIds((prev) => {
                          const next = new Set(prev);
                          next.add(task.id);
                          return next;
                        })
                      }
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs sm:col-span-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="rounded-md bg-rose-600 px-2 py-1.5 text-xs text-white sm:col-span-1"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTask(task.id, "up")}
                      disabled={idx === 0}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs disabled:opacity-50 sm:col-span-1"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTask(task.id, "down")}
                      disabled={idx === tasks.length - 1}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs disabled:opacity-50 sm:col-span-1"
                    >
                      Down
                    </button>
                  </>
                )}
              </div>

              {task.isTimed && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="font-mono text-lg tabular-nums">{formatSeconds(task.remainingSeconds)}</p>
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
                      updateTask(task.id, {
                        remainingSeconds: task.initialSeconds,
                        completed: false,
                      });
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
      </div>

      {allDone && (
        <p className="rounded-xl border border-emerald-400 bg-emerald-100 p-4 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">
          All daily tasks are completed.
        </p>
      )}
    </section>
  );
}
