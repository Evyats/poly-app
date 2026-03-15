import { RotateCcw } from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { formatSeconds } from "../../lib/time";
import type { RoutineTask } from "../../lib/types";

type RoutineTaskCardProps = {
  task: RoutineTask;
  index: number;
  total: number;
  isEditing: boolean;
  isRunning: boolean;
  onUpdate: (patch: Partial<RoutineTask>) => void;
  onToggleEditing: () => void;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
};

export function RoutineTaskCard(props: RoutineTaskCardProps) {
  const { task } = props;

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) => props.onUpdate({ completed: checked === true })}
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className={task.completed ? "line-through opacity-60" : ""}>{task.label}</CardTitle>
                <Badge variant={task.isTimed ? "secondary" : "outline"}>{task.isTimed ? "Timed" : "Simple"}</Badge>
              </div>
              <CardDescription>
                {task.isTimed ? `${Math.max(1, Math.floor(task.initialSeconds / 60) || 1)} min` : "No timer"} • Remaining{" "}
                {task.isTimed ? formatSeconds(task.remainingSeconds) : "n/a"}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={props.onToggleEditing}>
              {props.isEditing ? "Done" : "Edit"}
            </Button>
            <Button variant="ghost" size="sm" type="button" disabled={props.index === 0} onClick={() => props.onMove("up")}>
              Up
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={props.index === props.total - 1}
              onClick={() => props.onMove("down")}
            >
              Down
            </Button>
            <Button variant="destructive" size="sm" type="button" onClick={props.onRemove}>
              Remove
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {props.isEditing ? (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <Input value={task.label} onChange={(event) => props.onUpdate({ label: event.target.value })} />
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Timed</span>
                <Switch
                  checked={task.isTimed}
                  onCheckedChange={(checked) =>
                    props.onUpdate({
                      isTimed: checked,
                      initialSeconds: checked ? Math.max(task.initialSeconds, 60) : 0,
                      remainingSeconds: checked ? Math.max(task.remainingSeconds, 60) : 0,
                    })
                  }
                />
              </div>
              <Input
                className="mt-3"
                type="number"
                min={1}
                disabled={!task.isTimed}
                value={Math.max(1, Math.floor(task.initialSeconds / 60) || 1)}
                onChange={(event) => {
                  const minutes = Math.max(1, Number(event.target.value) || 1);
                  props.onUpdate({ initialSeconds: minutes * 60, remainingSeconds: minutes * 60, completed: false });
                }}
              />
            </div>
          </div>
        ) : null}

        {task.isTimed ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-background/70 p-4">
            <p className="font-mono text-xl font-medium tabular-nums text-foreground">{formatSeconds(task.remainingSeconds)}</p>
            <Button type="button" onClick={props.onToggleTimer}>
              {props.isRunning ? "Pause" : "Start"}
            </Button>
            <Button variant="outline" type="button" onClick={props.onResetTimer}>
              <RotateCcw className="size-4" />
              Reset timer
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
