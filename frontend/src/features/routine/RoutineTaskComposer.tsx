import type { FormEvent } from "react";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";

type RoutineTaskComposerProps = {
  newTaskLabel: string;
  newTaskTimed: boolean;
  newTaskMinutes: number;
  setNewTaskLabel: (value: string) => void;
  setNewTaskTimed: (value: boolean) => void;
  setNewTaskMinutes: (value: number) => void;
  onAddTask: () => void;
};

export function RoutineTaskComposer(props: RoutineTaskComposerProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Add task</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            props.onAddTask();
          }}
        >
          <Input
            value={props.newTaskLabel}
            onChange={(event) => props.setNewTaskLabel(event.target.value)}
            placeholder="Task label"
          />
          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Timed task</span>
              <Switch checked={props.newTaskTimed} onCheckedChange={props.setNewTaskTimed} />
            </div>
            <Input
              className="mt-3"
              type="number"
              min={1}
              disabled={!props.newTaskTimed}
              value={props.newTaskMinutes}
              onChange={(event) => props.setNewTaskMinutes(Number(event.target.value) || 1)}
            />
          </div>
          <Button className="w-full" type="submit">
            Add task
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
