"use client";

import { Doughnut } from "react-chartjs-2";
import { useMemo } from "react";
import { formatAnalyticsNumber } from "@/lib/analytics-utils";
import type { DonutSlice } from "@/lib/analytics-utils";
import { ANALYTICS_CHART_COLORS } from "@/components/admin/analytics/charts/analytics-chart-theme";
import "@/components/admin/analytics/charts/analytics-chart-registry";

type AnalyticsDonutChartProps = {
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
  colors?: readonly string[];
};

export function AnalyticsDonutChart({
  slices,
  centerLabel,
  centerValue,
  className,
  colors = ANALYTICS_CHART_COLORS,
}: AnalyticsDonutChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const chartKey = useMemo(
    () => slices.map((slice) => `${slice.id}:${slice.value}`).join("|"),
    [slices],
  );

  const data = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: slices.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const centerText =
    centerValue != null
      ? typeof centerValue === "number"
        ? formatAnalyticsNumber(centerValue)
        : centerValue
      : formatAnalyticsNumber(total);

  if (slices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No data for this range.</p>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative aspect-square w-full max-w-[170px] shrink-0">
          <Doughnut
            key={chartKey}
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              cutout: "70%",
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const value = Number(ctx.parsed);
                      const pct = total ? ((value / total) * 100).toFixed(1) : "0";
                      return `${ctx.label}: ${formatAnalyticsNumber(value)} (${pct}%)`;
                    },
                  },
                },
              },
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xl font-semibold tabular-nums text-foreground">{centerText}</p>
            {centerLabel ? (
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {centerLabel}
              </p>
            ) : null}
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[220px]">
          {slices.map((slice, index) => {
            const pct = total ? ((slice.value / total) * 100).toFixed(1) : "0";
            return (
              <li
                key={slice.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="truncate text-muted-foreground">{slice.label}</span>
                </span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatAnalyticsNumber(slice.value)}
                </span>
                <span className="w-12 text-right tabular-nums text-muted-foreground">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
