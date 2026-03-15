import type { VocabPack } from "../../lib/types";
import type { Round, RoundEntry } from "./types";

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function normalizeWords(words: string[]): string[] {
  return [...new Set(words.map((word) => word.trim()).filter(Boolean))];
}

export function sampleWord(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)] ?? "";
}

export function buildRounds(packs: VocabPack[]): Round[] {
  const pool = shuffle(
    packs
      .filter((pack) => pack.englishWords.length > 0 && pack.hebrewWords.length > 0)
      .map<RoundEntry>((pack) => ({
        packId: pack.id,
        english: sampleWord(pack.englishWords),
        hebrew: sampleWord(pack.hebrewWords),
      })),
  );

  const rounds: Round[] = [];
  while (pool.length > 0) {
    const chunk = pool.splice(0, 10);
    rounds.push({ entries: chunk, left: shuffle(chunk), right: shuffle(chunk) });
  }

  return rounds;
}
