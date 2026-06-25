"use client";

import { Bar } from "react-chartjs-2";
import { shortDateLabel } from "@/lib/analytics-utils";
import {
  ANALYTICS_CHART_GRID,
  ANALYTICS_CHART_TEXT,
  STACKED_DIFF_COLORS,
} from "@/components/admin/analytics/charts/analytics-chart-theme";
import "@/components/admin/analytics/charts/analytics-chart-registry";

type StackedPoint = {
  date: string;
  added: number;
  updated: number;
  unchanged: number;
  removed: number;
};

type AnalyticsStackedBarChartProps = {
  points: StackedPoint[];
  height?: number;
};

export function AnalyticsStackedBarChart({ points, height = 260 }: AnalyticsStackedBarChartProps) {
  const data = {
    labels: points.map((p) => shortDateLabel(p.date)),
    datasets: [
      {
        label: "Added",
        data: points.map((p) => p.added),
        backgroundColor: STACKED_DIFF_COLORS.added,
        stack: "diff",
      },
      {
        label: "Updated",
        data: points.map((p) => p.updated),
        backgroundColor: STACKED_DIFF_COLORS.updated,
        stack: "diff",
      },
      {
        label: "Unchanged",
        data: points.map((p) => p.unchanged),
        backgroundColor: STACKED_DIFF_COLORS.unchanged,
        stack: "diff",
      },
      {
        label: "Removed",
        data: points.map((p) => p.removed),
        backgroundColor: STACKED_DIFF_COLORS.removed,
        stack: "diff",
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: ANALYTICS_CHART_TEXT, boxWidth: 10, boxHeight: 10 },
            },
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: { color: ANALYTICS_CHART_TEXT, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
              stacked: true,
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
