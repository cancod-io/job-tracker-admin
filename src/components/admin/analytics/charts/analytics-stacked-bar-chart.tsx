"use client";

import { Bar } from "react-chartjs-2";
import { shortDateLabel } from "@/lib/analytics-utils";
import {
  ANALYTICS_CHART_GRID,
  ANALYTICS_CHART_TEXT,
  STACKED_DIFF_COLORS,
} from "@/components/admin/analytics/charts/analytics-chart-theme";
import "@/components/admin/analytics/charts/analytics-chart-registry";

type AddedPoint = {
  date: string;
  added: number;
};

type AnalyticsStackedBarChartProps = {
  points: AddedPoint[];
  height?: number;
};

/** Bar chart of jobs added per fetch run (added-only ingest model). */
export function AnalyticsStackedBarChart({ points, height = 260 }: AnalyticsStackedBarChartProps) {
  const data = {
    labels: points.map((p) => shortDateLabel(p.date)),
    datasets: [
      {
        label: "Added",
        data: points.map((p) => p.added),
        backgroundColor: STACKED_DIFF_COLORS.added,
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
