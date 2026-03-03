import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { api } from "../api/client";
import type { VocabGroup, VocabPack } from "../lib/types";

type GroupListResponse = { groups: VocabGroup[] };
type GroupDetailResponse = {
  group: { id: number; name: string };
  packs: VocabPack[];
};

type RoundEntry = {
  packId: number;
  english: string;
  hebrew: string;
};

type Round = {
  entries: RoundEntry[];
  left: RoundEntry[];
  right: RoundEntry[];
};

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  const randomIndex = (maxExclusive: number) => {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
  };

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function normalizeWords(words: string[]): string[] {
  return [...new Set(words.map((word) => word.trim()).filter(Boolean))];
}

function sampleWord(words: string[]): string {
  if (words.length === 0) return "";
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return words[array[0] % words.length];
  }
  return words[Math.floor(Math.random() * words.length)];
}

function buildRounds(packs: VocabPack[]): Round[] {
  const pool = shuffle(
    packs
      .filter((pack) => pack.englishWords.length > 0 && pack.hebrewWords.length > 0)
      .map((pack) => ({
        packId: pack.id,
        english: sampleWord(pack.englishWords),
        hebrew: sampleWord(pack.hebrewWords),
      })),
  );

  const rounds: Round[] = [];
  while (pool.length > 0) {
    const chunk = pool.splice(0, 10);
    rounds.push({
      entries: chunk,
      left: shuffle(chunk),
      right: shuffle(chunk),
    });
  }
  return rounds;
}

export function VocabTrainerPage() {
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

  const activeRound = gameRounds[roundIndex] ?? null;

  const progressText = useMemo(() => {
    if (!activeRound) return "No active game";
    return `Round ${roundIndex + 1}/${gameRounds.length} | Solved ${solvedPackIds.size}/${activeRound.entries.length}`;
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

    const stillExists = payload.groups.some((group) => group.id === selectedGroupId);
    if (!stillExists) {
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
    refreshGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId != null) {
      loadGroup(selectedGroupId);
    }
  }, [selectedGroupId]);

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    if (!newGroupName.trim()) return;
    setError(null);
    try {
      const payload = await api.post<GroupListResponse>("/api/vocab/groups", { name: newGroupName.trim() });
      setGroups(payload.groups);
      const created = payload.groups.find((group) => group.name === newGroupName.trim());
      setSelectedGroupId(created?.id ?? payload.groups[payload.groups.length - 1]?.id ?? null);
      setNewGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group");
    }
  }

  async function renameGroup() {
    if (selectedGroupId == null || !selectedGroupName.trim()) return;
    setError(null);
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
    setError(null);
    try {
      const payload = await api.delete<GroupListResponse>(`/api/vocab/groups/${groupId}`);
      setGroups(payload.groups);
      const nextGroupId = payload.groups[0]?.id ?? null;
      setSelectedGroupId(nextGroupId);
      if (nextGroupId == null) {
        setPacks([]);
        setSelectedGroupName("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete group");
    }
  }

  async function addPack(event: FormEvent) {
    event.preventDefault();
    if (selectedGroupId == null) return;

    const englishWords = normalizeWords(newEnglishWords);
    const hebrewWords = normalizeWords(newHebrewWords);
    if (englishWords.length === 0 || hebrewWords.length === 0) {
      setError("Pack must include at least one English and one Hebrew word");
      return;
    }

    setError(null);
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

  function updateWordField(
    side: "english" | "hebrew",
    index: number,
    value: string,
  ) {
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
    if (selectedGroupId == null) return;
    setError(null);
    try {
      const payload = await api.delete<GroupDetailResponse>(`/api/vocab/groups/${selectedGroupId}/packs/${packId}`);
      setPacks(payload.packs);
      await refreshGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete pack");
    }
  }

  function startGame() {
    const rounds = buildRounds(packs);
    setGameRounds(rounds);
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
    if (!activeRound || solvedPackIds.has(packId)) return;

    if (!selected) {
      setSelected({ side, packId });
      setGameMessage(null);
      return;
    }

    if (selected.side === side) {
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
        setSelected(null);
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

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Vocabulary Trainer</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Groups</h2>
          <form onSubmit={createGroup} className="flex gap-2">
            <input
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="New group"
              className="flex-1 rounded-md border border-slate-300 bg-transparent px-2 py-1.5"
            />
            <button className="rounded-md bg-cyan-600 px-3 py-1.5 text-white" type="submit">
              Add
            </button>
          </form>

          {groups.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-400 p-3 text-sm text-slate-500">
              No groups yet. Create one to start.
            </p>
          ) : (
            <ul className="space-y-2">
              {groups.map((group) => (
                <li key={group.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-left ${selectedGroupId === group.id ? "bg-cyan-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}
                  >
                    {group.name} ({group.packCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGroup(group.id)}
                    className="rounded-md bg-rose-600 px-2 py-1.5 text-xs text-white"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
          <h2 className="text-lg font-semibold">Word Packs</h2>
          {selectedGroupId == null ? (
            <p className="rounded-md border border-dashed border-slate-400 p-4 text-sm text-slate-500">
              Select a group first.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm">
                  Group name
                  <input
                    value={selectedGroupName}
                    onChange={(event) => setSelectedGroupName(event.target.value)}
                    className="mt-1 rounded-md border border-slate-300 bg-transparent px-2 py-1.5"
                  />
                </label>
                <button type="button" onClick={renameGroup} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                  Rename
                </button>
              </div>

              <form onSubmit={addPack} className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-2 rounded-md border border-slate-300 p-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">English alternatives</p>
                  {newEnglishWords.map((word, index) => (
                    <div key={`eng-${index}`} className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={word}
                        onChange={(event) => updateWordField("english", index, event.target.value)}
                        placeholder="English word"
                        className="w-full rounded-md border border-slate-300 bg-transparent px-2 py-1.5 sm:flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeWordField("english", index)}
                        className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs sm:w-auto"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addWordField("english")}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    + Add English Alternative
                  </button>
                </div>
                <div className="space-y-2 rounded-md border border-slate-300 p-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Hebrew alternatives</p>
                  {newHebrewWords.map((word, index) => (
                    <div key={`heb-${index}`} className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={word}
                        onChange={(event) => updateWordField("hebrew", index, event.target.value)}
                        placeholder="Hebrew word"
                        className="w-full rounded-md border border-slate-300 bg-transparent px-2 py-1.5 sm:flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeWordField("hebrew", index)}
                        className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs sm:w-auto"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addWordField("hebrew")}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    + Add Hebrew Alternative
                  </button>
                </div>
                <button className="rounded-md bg-cyan-600 px-3 py-1.5 text-white" type="submit">
                  Add Pack
                </button>
              </form>

              {packs.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-400 p-4 text-sm text-slate-500">
                  No packs yet.
                </p>
              ) : (
                <div className="max-h-72 overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-2 py-1 text-left">English Words</th>
                        <th className="px-2 py-1 text-left">Hebrew Words</th>
                        <th className="px-2 py-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {packs.map((pack) => (
                        <tr key={pack.id} className="border-t border-slate-200 dark:border-slate-700 align-top">
                          <td className="px-2 py-1">{pack.englishWords.join(", ")}</td>
                          <td className="px-2 py-1">{pack.hebrewWords.join(", ")}</td>
                          <td className="px-2 py-1 text-right">
                            <button
                              type="button"
                              onClick={() => removePack(pack.id)}
                              className="rounded bg-rose-600 px-2 py-1 text-xs text-white"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="rounded-md border border-rose-400 bg-rose-100 p-2 text-sm text-rose-900 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-100">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Game</h2>
          <button
            type="button"
            onClick={startGame}
            disabled={packs.length === 0}
            className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Start Game
          </button>
          <button
            type="button"
            onClick={stopGame}
            disabled={gameRounds.length === 0}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Stop Game
          </button>
          <span className="text-sm text-slate-500">{progressText}</span>
        </div>
        {gameMessage && (
          <p className="rounded-md border border-amber-400 bg-amber-100 p-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
            {gameMessage}
          </p>
        )}

        {gameRounds.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-400 p-4 text-sm text-slate-500">
            Start a game to play matching rounds (10 packs per round).
          </p>
        ) : gameFinished ? (
          <p className="rounded-md border border-emerald-400 bg-emerald-100 p-4 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">
            Great job, you finished all rounds in this group.
          </p>
        ) : activeRound ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">English</h3>
              {activeRound.left.map((entry) => {
                if (solvedPackIds.has(entry.packId)) return null;
                const isSelected = selected?.side === "left" && selected.packId === entry.packId;
                return (
                  <button
                    key={`left-${entry.packId}`}
                    type="button"
                    onClick={() => onPick("left", entry.packId)}
                    className={`block w-full rounded-md px-3 py-2 text-left ${isSelected ? "bg-cyan-600 text-white" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"}`}
                  >
                    {entry.english}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hebrew</h3>
              {activeRound.right.map((entry) => {
                if (solvedPackIds.has(entry.packId)) return null;
                const isSelected = selected?.side === "right" && selected.packId === entry.packId;
                return (
                  <button
                    key={`right-${entry.packId}`}
                    type="button"
                    onClick={() => onPick("right", entry.packId)}
                    className={`block w-full rounded-md px-3 py-2 text-right ${isSelected ? "bg-cyan-600 text-white" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"}`}
                  >
                    {entry.hebrew}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
