"use client";

import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import { shortDateLabel } from "@/lib/analytics-utils";
import {
  ANALYTICS_CHART_GRID,
  ANALYTICS_CHART_LINE,
  ANALYTICS_CHART_TEXT,
} from "@/components/admin/analytics/charts/analytics-chart-theme";
import "@/components/admin/analytics/charts/analytics-chart-registry";

type LinePoint = { date: string; value: number };

type AnalyticsLineChartProps = {
  points: LinePoint[];
  label?: string;
  color?: string;
  height?: number;
};

export function AnalyticsLineChart({
  points,
  label = "Count",
  color = ANALYTICS_CHART_LINE,
  height = 220,
}: AnalyticsLineChartProps) {
  const chartKey = useMemo(
    () => points.map((p) => `${p.date}:${p.value}`).join("|"),
    [points],
  );

  if (points.length === 0) {
    return (
      <p className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No trend data for this range.
      </p>
    );
  }

  const data = {
    labels: points.map((p) => shortDateLabel(p.date)),
    datasets: [
      {
        label,
        data: points.map((p) => p.value),
        borderColor: color,
        backgroundColor: color,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Line
        key={chartKey}
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: ANALYTICS_CHART_TEXT, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
              beginAtZero: true,
              grid: { color: ANALYTICS_CHART_GRID },
              ticks: { color: ANALYTICS_CHART_TEXT, precision: 0 },
            },
          },
        }}
      />
    </div>
  );
}
