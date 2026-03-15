import { CartesianGrid, Dot, Line, LineChart, XAxis, YAxis } from "recharts";

import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../../components/ui/chart";
import { fromMinuteOfDay } from "../../lib/time";

const chartConfig = {
  wake: { label: "Wake time", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

type WakeupChartCardProps = {
  chartData: Array<{ date: string; wake: number }>;
  yMax: number;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export function WakeupChartCard({ chartData, yMax, selectedDate, onSelectDate }: WakeupChartCardProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Wake-up chart</CardTitle>
            <CardDescription>Click a point to select it for deletion.</CardDescription>
          </div>
          {selectedDate ? <Badge variant="secondary">{selectedDate}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis domain={[0, yMax]} tickFormatter={(value) => fromMinuteOfDay(value)} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => fromMinuteOfDay(Number(value))} />
            <Line
              type="monotone"
              dataKey="wake"
              stroke="var(--color-wake)"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx = 0, cy = 0, payload } = props;
                const isSelected = selectedDate === payload.date;
                return (
                  <Dot
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? "hsl(var(--destructive))" : "var(--color-wake)"}
                    stroke="hsl(var(--background))"
                    onClick={() => onSelectDate(payload.date)}
                    style={{ cursor: "pointer" }}
                  />
                );
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
