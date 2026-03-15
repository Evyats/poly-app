import { Scale } from "lucide-react";

import { LoadingView } from "../../components/LoadingView";
import { PageHeader } from "../../components/PageHeader";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from "../../components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { WeightChartCard } from "./WeightChartCard";
import { WeightEntryForm } from "./WeightEntryForm";
import { useWeightTracker } from "./useWeightTracker";

export function WeightTrackerView() {
  const tracker = useWeightTracker();

  if (tracker.loading) {
    return <LoadingView label="Loading weight tracker..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Body metrics" title="Weight tracker" description="Record weigh-ins and inspect the raw line, moving average, and trend." meta={`${tracker.entries.length} entries`} />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <WeightEntryForm date={tracker.date} setDate={tracker.setDate} weight={tracker.weight} setWeight={tracker.setWeight} onSave={tracker.saveEntry} />

        <div className="space-y-6">
          {tracker.chartData.length === 0 ? (
            <EmptyState className="glass-panel">
              <EmptyStateIcon><Scale className="size-6" /></EmptyStateIcon>
              <EmptyStateTitle>No weight data yet</EmptyStateTitle>
              <EmptyStateDescription>Add your first weight entry to render the chart overlays.</EmptyStateDescription>
            </EmptyState>
          ) : (
            <WeightChartCard chartData={tracker.chartData} />
          )}

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Entry log</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Signal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tracker.entries.map((entry, index) => {
                    const previous = index > 0 ? tracker.entries[index - 1].weight : null;
                    const signal = previous == null ? "Start" : entry.weight > previous ? "Up" : entry.weight < previous ? "Down" : "Flat";
                    return (
                      <TableRow key={entry.date}>
                        <TableCell className="font-medium">{entry.date}</TableCell>
                        <TableCell className="text-right">{entry.weight.toFixed(1)} kg</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={signal === "Down" ? "secondary" : signal === "Up" ? "destructive" : "outline"}>{signal}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
