import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client";
import type { RoutineState, RoutineTask } from "../../lib/types";
import { playDoneChime } from "./audio";
import { generateTaskId } from "./utils";

export function useRoutineTracker() {
  const [studyCentiseconds, setStudyCentiseconds] = useState(0);
  const [studyRunning, setStudyRunning] = useState(false);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [runningByTask, setRunningByTask] = useState<Record<string, boolean>>({});
  const [editingTaskIds, setEditingTaskIds] = useState<Set<string>>(new Set());
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskTimed, setNewTaskTimed] = useState(false);
  const [newTaskMinutes, setNewTaskMinutes] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<RoutineState>("/api/routine/today")
      .then((data) => {
        setStudyCentiseconds(data.studySeconds * 100);
        setTasks(data.tasks);
      })
      .finally(() => setLoading(false));
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
      void api.put<RoutineState>("/api/routine/today", {
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

  const completedTasks = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const progressValue = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const allDone = tasks.length > 0 && tasks.every((task) => task.completed);

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
    if (!label) {
      return;
    }

    const initialSeconds = newTaskTimed ? Math.max(0, Math.floor(newTaskMinutes * 60)) : 0;
    const id = generateTaskId();

    setTasks((prev) => [
      ...prev,
      { id, label, isTimed: newTaskTimed, initialSeconds, remainingSeconds: initialSeconds, completed: false },
    ]);
    setNewTaskLabel("");
    setNewTaskTimed(false);
    setNewTaskMinutes(5);
  }

  function moveTask(taskId: string, direction: "up" | "down") {
    setTasks((prev) => {
      const index = prev.findIndex((task) => task.id === taskId);
      if (index === -1) {
        return prev;
      }
      if (direction === "up" && index === 0) {
        return prev;
      }
      if (direction === "down" && index === prev.length - 1) {
        return prev;
      }

      const next = [...prev];
      const swapWith = direction === "up" ? index - 1 : index + 1;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  }

  function handleManualEdit(part: "h" | "m" | "s", value: string) {
    if (studyRunning) {
      return;
    }

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

  function toggleTaskEditing(taskId: string) {
    setEditingTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  function toggleTaskTimer(taskId: string) {
    setRunningByTask((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  function resetTaskTimer(task: RoutineTask) {
    setRunningByTask((prev) => ({ ...prev, [task.id]: false }));
    updateTask(task.id, { remainingSeconds: task.initialSeconds, completed: false });
  }

  function resetStudyTimer() {
    setStudyRunning(false);
    setStudyCentiseconds(0);
  }

  return {
    loading,
    studyCentiseconds,
    studyRunning,
    tasks,
    runningByTask,
    editingTaskIds,
    newTaskLabel,
    newTaskTimed,
    newTaskMinutes,
    completedTasks,
    progressValue,
    allDone,
    setStudyRunning,
    setNewTaskLabel,
    setNewTaskTimed,
    setNewTaskMinutes,
    addTask,
    updateTask,
    removeTask,
    moveTask,
    handleManualEdit,
    toggleTaskEditing,
    toggleTaskTimer,
    resetTaskTimer,
    resetStudyTimer,
  };
}
