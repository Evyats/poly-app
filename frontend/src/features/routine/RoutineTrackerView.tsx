import { ListTodo } from "lucide-react";

import { LoadingView } from "../../components/LoadingView";
import { PageHeader } from "../../components/PageHeader";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from "../../components/ui/empty-state";
import { Progress } from "../../components/ui/progress";
import { RoutineStudyTimerCard } from "./RoutineStudyTimerCard";
import { RoutineTaskCard } from "./RoutineTaskCard";
import { RoutineTaskComposer } from "./RoutineTaskComposer";
import { useRoutineTracker } from "./useRoutineTracker";

export function RoutineTrackerView() {
  const tracker = useRoutineTracker();

  if (tracker.loading) {
    return <LoadingView label="Loading routine tracker..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Daily flow"
        title="Routine tracker"
        description="Study timer plus checklist."
        meta={`${tracker.completedTasks}/${tracker.tasks.length} complete`}
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6">
          <RoutineStudyTimerCard
            studyCentiseconds={tracker.studyCentiseconds}
            studyRunning={tracker.studyRunning}
            onToggleRunning={() => tracker.setStudyRunning((value) => !value)}
            onReset={tracker.resetStudyTimer}
            onManualEdit={tracker.handleManualEdit}
          />
          <RoutineTaskComposer
            newTaskLabel={tracker.newTaskLabel}
            newTaskTimed={tracker.newTaskTimed}
            newTaskMinutes={tracker.newTaskMinutes}
            setNewTaskLabel={tracker.setNewTaskLabel}
            setNewTaskTimed={tracker.setNewTaskTimed}
            setNewTaskMinutes={tracker.setNewTaskMinutes}
            onAddTask={tracker.addTask}
          />
        </div>

        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Progress</CardTitle>
                <Badge variant={tracker.allDone ? "secondary" : "outline"}>
                  {tracker.allDone ? "All done" : "In progress"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Daily completion</span>
                <span className="font-medium text-foreground">{tracker.progressValue}%</span>
              </div>
              <Progress value={tracker.progressValue} />
            </CardContent>
          </Card>

          {tracker.tasks.length === 0 ? (
            <EmptyState className="glass-panel">
              <EmptyStateIcon>
                <ListTodo className="size-6" />
              </EmptyStateIcon>
              <EmptyStateTitle>No routine tasks yet</EmptyStateTitle>
              <EmptyStateDescription>Add your first task to build today's routine checklist.</EmptyStateDescription>
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {tracker.tasks.map((task, index) => (
                <RoutineTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  total={tracker.tasks.length}
                  isEditing={tracker.editingTaskIds.has(task.id)}
                  isRunning={Boolean(tracker.runningByTask[task.id])}
                  onUpdate={(patch) => tracker.updateTask(task.id, patch)}
                  onToggleEditing={() => tracker.toggleTaskEditing(task.id)}
                  onMove={(direction) => tracker.moveTask(task.id, direction)}
                  onRemove={() => tracker.removeTask(task.id)}
                  onToggleTimer={() => tracker.toggleTaskTimer(task.id)}
                  onResetTimer={() => tracker.resetTaskTimer(task)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
