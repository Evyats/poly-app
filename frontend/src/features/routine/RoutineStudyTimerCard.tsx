import { Play, TimerReset } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { formatCentiseconds } from "../../lib/time";

type RoutineStudyTimerCardProps = {
  studyCentiseconds: number;
  studyRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
  onManualEdit: (part: "h" | "m" | "s", value: string) => void;
};

export function RoutineStudyTimerCard(props: RoutineStudyTimerCardProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Study timer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          type="button"
          onClick={props.onToggleRunning}
          className="w-full rounded-2xl border border-border bg-background px-4 py-8 text-center transition hover:border-ring/60"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Stopwatch</p>
          <p className="mt-3 font-mono text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {formatCentiseconds(props.studyCentiseconds)}
          </p>
        </button>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" onClick={props.onToggleRunning}>
            <Play className="size-4" />
            {props.studyRunning ? "Pause" : "Start"}
          </Button>
          <Button variant="outline" type="button" onClick={props.onReset}>
            <TimerReset className="size-4" />
            Reset
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            disabled={props.studyRunning}
            type="number"
            min={0}
            value={Math.floor(props.studyCentiseconds / 100 / 3600)}
            onChange={(event) => props.onManualEdit("h", event.target.value)}
          />
          <Input
            disabled={props.studyRunning}
            type="number"
            min={0}
            max={59}
            value={Math.floor((Math.floor(props.studyCentiseconds / 100) % 3600) / 60)}
            onChange={(event) => props.onManualEdit("m", event.target.value)}
          />
          <Input
            disabled={props.studyRunning}
            type="number"
            min={0}
            max={59}
            value={Math.floor(props.studyCentiseconds / 100) % 60}
            onChange={(event) => props.onManualEdit("s", event.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
