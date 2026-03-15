import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../../components/ui/chart";
import type { WeightChartPoint } from "./useWeightTracker";

const chartConfig = {
  weight: { label: "Raw", color: "hsl(var(--chart-2))" },
  movingAvg: { label: "Moving avg", color: "hsl(var(--chart-3))" },
  trend: { label: "Trend", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

type WeightChartCardProps = {
  chartData: WeightChartPoint[];
};

export function WeightChartCard({ chartData }: WeightChartCardProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Weight chart</CardTitle>
        <CardDescription>Raw points, short moving average, and an overall trend line.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="weight" stroke="var(--color-weight)" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="movingAvg" stroke="var(--color-movingAvg)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="trend" stroke="var(--color-trend)" strokeWidth={2} dot={false} strokeDasharray="6 4" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
