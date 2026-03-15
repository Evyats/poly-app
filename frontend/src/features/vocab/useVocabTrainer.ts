import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { api } from "../../api/client";
import type { VocabGroup, VocabPack } from "../../lib/types";
import { buildRounds, normalizeWords } from "./utils";
import type { GroupDetailResponse, GroupListResponse, Round } from "./types";

export function useVocabTrainer() {
  const [groups, setGroups] = useState<VocabGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [packs, setPacks] = useState<VocabPack[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newEnglishWords, setNewEnglishWords] = useState<string[]>([""]);
  const [newHebrewWords, setNewHebrewWords] = useState<string[]>([""]);
  const [gameRounds, setGameRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [solvedPackIds, setSolvedPackIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<{ side: "left" | "right"; packId: number } | null>(null);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const activeRound = gameRounds[roundIndex] ?? null;
  const progressText = useMemo(() => {
    if (!activeRound) {
      return "No active game";
    }
    return `Round ${roundIndex + 1}/${gameRounds.length} • Solved ${solvedPackIds.size}/${activeRound.entries.length}`;
  }, [activeRound, roundIndex, gameRounds.length, solvedPackIds.size]);

  async function refreshGroups() {
    const payload = await api.get<GroupListResponse>("/api/vocab/groups");
    setGroups(payload.groups);
    if (payload.groups.length === 0) {
      setSelectedGroupId(null);
      setPacks([]);
      setSelectedGroupName("");
      return;
    }
    if (!payload.groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(payload.groups[0].id);
    }
  }

  async function loadGroup(groupId: number) {
    const payload = await api.get<GroupDetailResponse>(`/api/vocab/groups/${groupId}`);
    setSelectedGroupId(payload.group.id);
    setSelectedGroupName(payload.group.name);
    setPacks(payload.packs);
    setGameRounds([]);
    setSelected(null);
    setSolvedPackIds(new Set());
    setRoundIndex(0);
  }

  useEffect(() => {
    refreshGroups().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedGroupId != null) {
      void loadGroup(selectedGroupId);
    }
  }, [selectedGroupId]);

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    if (!newGroupName.trim()) {
      return;
    }
    setError(null);
    try {
      const payload = await api.post<GroupListResponse>("/api/vocab/groups", { name: newGroupName.trim() });
      setGroups(payload.groups);
      setSelectedGroupId(payload.groups[payload.groups.length - 1]?.id ?? null);
      setNewGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group");
    }
  }

  async function renameGroup() {
    if (selectedGroupId == null || !selectedGroupName.trim()) {
      return;
    }
    try {
      const payload = await api.patch<GroupListResponse>(`/api/vocab/groups/${selectedGroupId}`, {
        name: selectedGroupName.trim(),
      });
      setGroups(payload.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename group");
    }
  }

  async function deleteGroup(groupId: number) {
    const payload = await api.delete<GroupListResponse>(`/api/vocab/groups/${groupId}`);
    setGroups(payload.groups);
    setSelectedGroupId(payload.groups[0]?.id ?? null);
  }

  async function addPack(event: FormEvent) {
    event.preventDefault();
    if (selectedGroupId == null) {
      return;
    }
    const englishWords = normalizeWords(newEnglishWords);
    const hebrewWords = normalizeWords(newHebrewWords);
    if (englishWords.length === 0 || hebrewWords.length === 0) {
      setError("Pack must include at least one English and one Hebrew word");
      return;
    }
    try {
      const payload = await api.post<GroupDetailResponse>(`/api/vocab/groups/${selectedGroupId}/packs`, {
        englishWords,
        hebrewWords,
      });
      setPacks(payload.packs);
      setNewEnglishWords([""]);
      setNewHebrewWords([""]);
      await refreshGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add pack");
    }
  }

  function updateWordField(side: "english" | "hebrew", index: number, value: string) {
    if (side === "english") {
      setNewEnglishWords((prev) => prev.map((word, idx) => (idx === index ? value : word)));
      return;
    }

    setNewHebrewWords((prev) => prev.map((word, idx) => (idx === index ? value : word)));
  }

  function addWordField(side: "english" | "hebrew") {
    if (side === "english") {
      setNewEnglishWords((prev) => [...prev, ""]);
      return;
    }

    setNewHebrewWords((prev) => [...prev, ""]);
  }

  function removeWordField(side: "english" | "hebrew", index: number) {
    if (side === "english") {
      setNewEnglishWords((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
      return;
    }

    setNewHebrewWords((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  }

  async function removePack(packId: number) {
    if (selectedGroupId == null) {
      return;
    }
    const payload = await api.delete<GroupDetailResponse>(`/api/vocab/groups/${selectedGroupId}/packs/${packId}`);
    setPacks(payload.packs);
    await refreshGroups();
  }

  function startGame() {
    setGameRounds(buildRounds(packs));
    setRoundIndex(0);
    setSolvedPackIds(new Set());
    setSelected(null);
    setGameMessage(null);
  }

  function stopGame() {
    setGameRounds([]);
    setRoundIndex(0);
    setSolvedPackIds(new Set());
    setSelected(null);
    setGameMessage(null);
  }

  function onPick(side: "left" | "right", packId: number) {
    if (!activeRound || solvedPackIds.has(packId)) {
      return;
    }
    if (!selected || selected.side === side) {
      setSelected({ side, packId });
      setGameMessage(null);
      return;
    }
    if (selected.packId === packId) {
      const next = new Set(solvedPackIds);
      next.add(packId);
      setSolvedPackIds(next);
      setSelected(null);
      if (next.size === activeRound.entries.length && roundIndex < gameRounds.length - 1) {
        setRoundIndex(roundIndex + 1);
        setSolvedPackIds(new Set());
      }
      setGameMessage(null);
      return;
    }
    setSelected({ side, packId });
    setGameMessage("Wrong mapping. Try again.");
  }

  const gameFinished =
    gameRounds.length > 0 &&
    roundIndex === gameRounds.length - 1 &&
    activeRound != null &&
    solvedPackIds.size === activeRound.entries.length;

  return {
    loading,
    error,
    groups,
    selectedGroupId,
    selectedGroupName,
    packs,
    newGroupName,
    newEnglishWords,
    newHebrewWords,
    gameRounds,
    activeRound,
    progressText,
    roundIndex,
    solvedPackIds,
    selected,
    gameMessage,
    gameFinished,
    setSelectedGroupId,
    setSelectedGroupName,
    setNewGroupName,
    createGroup,
    renameGroup,
    deleteGroup,
    addPack,
    updateWordField,
    addWordField,
    removeWordField,
    removePack,
    startGame,
    stopGame,
    onPick,
  };
}
