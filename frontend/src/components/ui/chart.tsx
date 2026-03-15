import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "../../lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
    theme?: Record<keyof typeof THEMES, string>;
  };
};

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within ChartContainer");
  }
  return context;
}

export function ChartContainer({
  id,
  className,
  config,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex h-[18rem] w-full items-center justify-center text-xs",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color || item.theme);
  if (colorConfig.length === 0) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart="${id}"] {
${colorConfig
  .map(([key, value]) => {
    const color = value.theme?.[theme as keyof typeof value.theme] ?? value.color;
    return color ? `  --color-${key}: ${color};` : "";
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;
export const ChartLegend = RechartsPrimitive.Legend;

export function ChartTooltipContent({
  active,
  payload,
  className,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: string | number;
    color?: string;
    payload?: { fill?: string };
  }>;
  className?: string;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={cn("grid min-w-[9rem] gap-1.5 rounded-lg border border-border/70 bg-popover px-3 py-2 text-xs shadow-xl", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "value");
        const itemConfig = config[key];
        const indicatorColor = item.color ?? item.payload?.fill;

        return (
          <div key={`${key}-${item.value}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-[3px]" style={{ backgroundColor: indicatorColor }} />
              <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
            </div>
            <span className="font-mono font-medium text-foreground tabular-nums">
              {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ChartLegendContent({
  payload,
  className,
}: {
  payload?: Array<{ dataKey?: string | number; value?: string; color?: string }>;
  className?: string;
}) {
  const { config } = useChart();
  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 pt-4 text-sm", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? "value");
        const itemConfig = config[key];
        return (
          <div key={key} className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-[3px]" style={{ backgroundColor: item.color }} />
            <span>{itemConfig?.label ?? item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
