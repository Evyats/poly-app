import { Eraser, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { DatePicker } from "../../components/ui/date-picker";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import type { WakeupFilterMode } from "./useWakeupTracker";

type WakeupControlsProps = {
  date: string;
  time: string;
  setDate: (value: string) => void;
  setTime: (value: string) => void;
  filterMode: WakeupFilterMode;
  setFilterMode: (value: WakeupFilterMode) => void;
  monthFilter: string;
  setMonthFilter: (value: string) => void;
  yearFilter: string;
  setYearFilter: (value: string) => void;
  months: string[];
  years: string[];
  manualYCap: string;
  setManualYCap: (value: string) => void;
  useAutoCap: boolean;
  setUseAutoCap: (value: boolean) => void;
  onSave: () => Promise<void>;
  onDeleteSelected: () => Promise<void>;
  onReset: () => Promise<void>;
  canDelete: boolean;
};

export function WakeupControls(props: WakeupControlsProps) {
  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Log entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DatePicker value={props.date} onChange={props.setDate} />
          <Input type="time" value={props.time} onChange={(event) => props.setTime(event.target.value)} required />
          <Button className="w-full" type="button" onClick={() => void props.onSave()}>
            Save entry
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>View controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={props.filterMode} onValueChange={(value) => props.setFilterMode(value as WakeupFilterMode)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="month">By month</SelectItem>
              <SelectItem value="year">By year</SelectItem>
            </SelectContent>
          </Select>

          {props.filterMode === "month" ? (
            <Select value={props.monthFilter} onValueChange={props.setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {props.months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {props.filterMode === "year" ? (
            <Select value={props.yearFilter} onValueChange={props.setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {props.years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Auto Y-axis cap</p>
                <p className="text-sm text-muted-foreground">Disable to set a manual max in minutes.</p>
              </div>
              <Switch checked={props.useAutoCap} onCheckedChange={props.setUseAutoCap} />
            </div>
            <Input className="mt-3" type="number" min={1} max={1439} value={props.manualYCap} disabled={props.useAutoCap} onChange={(event) => props.setManualYCap(event.target.value)} placeholder="Manual Y cap" />
          </div>

          <div className="grid gap-2">
            <Button variant="destructive" type="button" onClick={() => void props.onDeleteSelected()} disabled={!props.canDelete}>
              <Trash2 className="size-4" />
              Delete selected
            </Button>
            <Button variant="outline" type="button" onClick={() => void props.onReset()}>
              <Eraser className="size-4" />
              Reset seed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
