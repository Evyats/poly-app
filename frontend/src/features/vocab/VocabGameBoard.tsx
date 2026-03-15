import { BookMarked, Languages, Play } from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from "../../components/ui/empty-state";
import type { Round } from "./types";

type VocabGameBoardProps = {
  packsCount: number;
  selectedGroupName: string;
  gameRounds: Round[];
  activeRound: Round | null;
  solvedPackIds: Set<number>;
  selected: { side: "left" | "right"; packId: number } | null;
  progressText: string;
  gameMessage: string | null;
  gameFinished: boolean;
  onStartGame: () => void;
  onStopGame: () => void;
  onPick: (side: "left" | "right", packId: number) => void;
};

export function VocabGameBoard(props: VocabGameBoardProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="outline" className="mb-3">
              Matching game
            </Badge>
            <CardTitle>Practice the current group</CardTitle>
            <CardDescription>Rounds are built from the selected group's packs, up to 10 per round.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={props.onStartGame} disabled={props.packsCount === 0}>
              <Play className="size-4" />
              Start game
            </Button>
            <Button type="button" variant="outline" onClick={props.onStopGame} disabled={props.gameRounds.length === 0}>
              Stop
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{props.progressText}</Badge>
          {props.selectedGroupName ? <Badge variant="outline">{props.selectedGroupName}</Badge> : null}
        </div>
        {props.gameMessage ? (
          <div className="rounded-xl border border-amber-400/50 bg-amber-100/70 p-4 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            {props.gameMessage}
          </div>
        ) : null}

        {props.gameRounds.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>
              <Languages className="size-6" />
            </EmptyStateIcon>
            <EmptyStateTitle>No active game</EmptyStateTitle>
            <EmptyStateDescription>Start a game to generate randomized columns for matching.</EmptyStateDescription>
          </EmptyState>
        ) : props.gameFinished ? (
          <EmptyState>
            <EmptyStateIcon>
              <BookMarked className="size-6" />
            </EmptyStateIcon>
            <EmptyStateTitle>Round set complete</EmptyStateTitle>
            <EmptyStateDescription>You finished all rounds for the selected group.</EmptyStateDescription>
          </EmptyState>
        ) : props.activeRound ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 bg-background/70">
              <CardHeader>
                <CardTitle className="text-lg">English</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {props.activeRound.left.map((entry) => {
                  if (props.solvedPackIds.has(entry.packId)) {
                    return null;
                  }
                  const isSelected = props.selected?.side === "left" && props.selected.packId === entry.packId;
                  return (
                    <Button
                      key={`left-${entry.packId}`}
                      variant={isSelected ? "default" : "outline"}
                      type="button"
                      className="w-full justify-start"
                      onClick={() => props.onPick("left", entry.packId)}
                    >
                      {entry.english}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-background/70">
              <CardHeader>
                <CardTitle className="text-lg">Hebrew</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {props.activeRound.right.map((entry) => {
                  if (props.solvedPackIds.has(entry.packId)) {
                    return null;
                  }
                  const isSelected = props.selected?.side === "right" && props.selected.packId === entry.packId;
                  return (
                    <Button
                      key={`right-${entry.packId}`}
                      variant={isSelected ? "default" : "outline"}
                      type="button"
                      className="w-full justify-end"
                      onClick={() => props.onPick("right", entry.packId)}
                    >
                      <span data-lang="he">{entry.hebrew}</span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
