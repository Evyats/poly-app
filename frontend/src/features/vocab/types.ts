import type { VocabGroup, VocabPack } from "../../lib/types";

export type GroupListResponse = {
  groups: VocabGroup[];
};

export type GroupDetailResponse = {
  group: { id: number; name: string };
  packs: VocabPack[];
};

export type RoundEntry = {
  packId: number;
  english: string;
  hebrew: string;
};

export type Round = {
  entries: RoundEntry[];
  left: RoundEntry[];
  right: RoundEntry[];
};
