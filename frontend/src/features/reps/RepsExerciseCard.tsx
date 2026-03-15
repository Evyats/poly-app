import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import type { FlatExercise } from "./useRepsTracker";

type RepsExerciseCardProps = {
  exercise: FlatExercise;
  showTabName: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPatch: (patch: { reps?: number; step?: number }) => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
};

export function RepsExerciseCard({ exercise, showTabName, isFirst, isLast, onPatch, onMove, onDelete }: RepsExerciseCardProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            {showTabName ? <Badge variant="outline">{exercise.tabName}</Badge> : null}
            <CardTitle>{exercise.name}</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" type="button" onClick={onDelete}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete exercise</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="number" min={0} value={exercise.reps} onChange={(event) => onPatch({ reps: Number(event.target.value) })} />
          <Input type="number" min={1} value={exercise.step} onChange={(event) => onPatch({ step: Number(event.target.value) })} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" type="button" onClick={() => onPatch({ reps: Math.max(0, exercise.reps - exercise.step) })}>- Step</Button>
          <Button variant="outline" type="button" onClick={() => onPatch({ reps: exercise.reps + exercise.step })}>+ Step</Button>
          <Button variant="secondary" type="button" onClick={() => onPatch({ reps: 0 })}>Reset</Button>
          <div className="grid grid-cols-2 gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" type="button" disabled={isFirst} onClick={() => onMove("up")}>
                    <ArrowUp className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move up</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" type="button" disabled={isLast} onClick={() => onMove("down")}>
                    <ArrowDown className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move down</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
