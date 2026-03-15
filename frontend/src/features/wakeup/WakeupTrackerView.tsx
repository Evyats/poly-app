import { Sunrise } from "lucide-react";

import { LoadingView } from "../../components/LoadingView";
import { PageHeader } from "../../components/PageHeader";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from "../../components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { WakeupChartCard } from "./WakeupChartCard";
import { WakeupControls } from "./WakeupControls";
import { useWakeupTracker } from "./useWakeupTracker";

export function WakeupTrackerView() {
  const tracker = useWakeupTracker();

  if (tracker.loading) {
    return <LoadingView label="Loading wake-up tracker..." />;
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Recovery" title="Wake-up tracker" description="Log wake times, filter the dataset, and inspect the line chart." meta={`${tracker.entries.length} entries • avg ${tracker.averageWake}`} />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <WakeupControls
          date={tracker.date}
          setDate={tracker.setDate}
          time={tracker.time}
          setTime={tracker.setTime}
          filterMode={tracker.filterMode}
          setFilterMode={tracker.setFilterMode}
          monthFilter={tracker.monthFilter}
          setMonthFilter={tracker.setMonthFilter}
          yearFilter={tracker.yearFilter}
          setYearFilter={tracker.setYearFilter}
          months={tracker.months}
          years={tracker.years}
          manualYCap={tracker.manualYCap}
          setManualYCap={tracker.setManualYCap}
          useAutoCap={tracker.useAutoCap}
          setUseAutoCap={tracker.setUseAutoCap}
          onSave={tracker.saveEntry}
          onDeleteSelected={tracker.deleteSelected}
          onReset={tracker.resetEntries}
          canDelete={tracker.selectedDate != null}
        />

        <div className="space-y-6">
          {tracker.chartData.length === 0 ? (
            <EmptyState className="glass-panel">
              <EmptyStateIcon><Sunrise className="size-6" /></EmptyStateIcon>
              <EmptyStateTitle>No wake-up data yet</EmptyStateTitle>
              <EmptyStateDescription>Add your first entry to unlock chart and table views.</EmptyStateDescription>
            </EmptyState>
          ) : (
            <WakeupChartCard chartData={tracker.chartData} yMax={tracker.yMax} selectedDate={tracker.selectedDate} onSelectDate={tracker.setSelectedDate} />
          )}

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Entries</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Wake-up time</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tracker.filtered.map((entry) => (
                    <TableRow key={entry.date}>
                      <TableCell className="font-medium">{entry.date}</TableCell>
                      <TableCell>{entry.time}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={tracker.selectedDate === entry.date ? "destructive" : "outline"}>
                          {tracker.selectedDate === entry.date ? "Selected" : "Logged"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
