import type { FormEvent } from "react";
import { Dumbbell, Plus, RefreshCw } from "lucide-react";

import { LoadingView } from "../../components/LoadingView";
import { PageHeader } from "../../components/PageHeader";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { RepsExerciseCard } from "./RepsExerciseCard";
import { useRepsTracker } from "./useRepsTracker";

export function RepsTrackerView() {
  const tracker = useRepsTracker();

  if (tracker.loading) {
    return <LoadingView label="Loading reps tracker..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Fitness" title="Reps tracker" description="Tabs, exercises, rep targets, and quick step controls." meta={`${tracker.data.tabs.length} tabs • ${tracker.combinedExercises.length} exercises`} action={<Button variant="outline" onClick={() => void tracker.refresh()}><RefreshCw className="size-4" />Refresh</Button>} />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="glass-panel">
          <CardHeader>
            <Badge variant="outline" className="w-fit">Tabs</Badge>
            <CardTitle>Workout groups</CardTitle>
            <CardDescription>Create, rename, and remove workout tabs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(event: FormEvent) => { event.preventDefault(); void tracker.createTab(); }} className="space-y-3">
              <Input value={tracker.newTabName} onChange={(event) => tracker.setNewTabName(event.target.value)} placeholder="New tab name" />
              <Button type="submit" className="w-full"><Plus className="size-4" />Add tab</Button>
            </form>

            <Tabs value={tracker.activeTabId} onValueChange={tracker.setActiveTabId}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start">
                <TabsTrigger value="all">All</TabsTrigger>
                {tracker.data.tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id}>{tab.name}</TabsTrigger>)}
              </TabsList>
            </Tabs>

            {tracker.activeTab && tracker.activeTabId !== "all" ? (
              <div className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
                <Input value={tracker.renameValue} onChange={(event) => tracker.setRenameValue(event.target.value)} placeholder="Rename selected tab" />
                <div className="flex gap-2">
                  <Button className="flex-1" variant="secondary" type="button" onClick={() => void tracker.renameTab()}>Rename</Button>
                  <Button className="flex-1" variant="destructive" type="button" onClick={() => void tracker.removeTab(tracker.activeTab!.id)}>Remove</Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {tracker.activeTabId !== "all" ? (
            <Card className="glass-panel">
              <CardHeader><CardTitle>Add an exercise</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={(event: FormEvent) => { event.preventDefault(); void tracker.createExercise(); }} className="flex flex-col gap-3 sm:flex-row">
                  <Input value={tracker.newExerciseName} onChange={(event) => tracker.setNewExerciseName(event.target.value)} placeholder="Exercise name" className="flex-1" />
                  <Button type="submit"><Plus className="size-4" />Add exercise</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {tracker.listToRender.length === 0 ? (
            <EmptyState className="glass-panel">
              <EmptyStateIcon><Dumbbell className="size-6" /></EmptyStateIcon>
              <EmptyStateTitle>No exercises yet</EmptyStateTitle>
              <EmptyStateDescription>Create a tab and add your first exercise.</EmptyStateDescription>
            </EmptyState>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {tracker.listToRender.map((exercise, idx) => (
                <RepsExerciseCard
                  key={`${exercise.tabId}-${exercise.id}`}
                  exercise={exercise}
                  showTabName={tracker.activeTabId === "all"}
                  isFirst={tracker.activeTabId === "all" || idx === 0}
                  isLast={tracker.activeTabId === "all" || idx === tracker.listToRender.length - 1}
                  onPatch={(patch) => void tracker.patchExercise(exercise.tabId, exercise.id, patch)}
                  onMove={(direction) => void tracker.moveExercise(exercise.tabId, exercise.id, direction)}
                  onDelete={() => void tracker.deleteExercise(exercise.tabId, exercise.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
