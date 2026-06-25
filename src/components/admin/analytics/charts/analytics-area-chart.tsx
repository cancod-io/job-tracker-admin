"use client";

import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import type { Chart } from "chart.js";
import { formatAnalyticsPercent, shortDateLabel } from "@/lib/analytics-utils";
import {
  ANALYTICS_CHART_GRID,
  ANALYTICS_CHART_SUCCESS,
  ANALYTICS_CHART_SUCCESS_AREA,
  ANALYTICS_CHART_TEXT,
} from "@/components/admin/analytics/charts/analytics-chart-theme";
import "@/components/admin/analytics/charts/analytics-chart-registry";

type AreaPoint = { date: string; value: number };

const pointLabelsPlugin = {
  id: "pointLabels",
  afterDatasetsDraw(chart: Chart<"line">) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    if (!dataset) return;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = "11px sans-serif";
    ctx.fillStyle = ANALYTICS_CHART_SUCCESS;
    ctx.textAlign = "center";
    meta.data.forEach((point, index) => {
      const raw = dataset.data[index];
      if (raw == null || typeof raw === "object") return;
      const label = formatAnalyticsPercent(Number(raw), false);
      ctx.fillText(label, point.x, point.y - 10);
    });
    ctx.restore();
  },
};

type AnalyticsAreaChartProps = {
  points: AreaPoint[];
  label?: string;
  asPercent?: boolean;
  height?: number;
};

export function AnalyticsAreaChart({
  points,
  label = "Rate",
  asPercent = true,
  height = 220,
}: AnalyticsAreaChartProps) {
  const chartKey = useMemo(
    () => points.map((p) => `${p.date}:${p.value}`).join("|"),
    [points],
  );

  if (points.length === 0) {
    return (
      <p className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No success rate data for this range.
      </p>
    );
  }

  const data = {
    labels: points.map((p) => shortDateLabel(p.date)),
    datasets: [
      {
        label,
        data: points.map((p) => (asPercent && p.value <= 1 ? p.value * 100 : p.value)),
        borderColor: ANALYTICS_CHART_SUCCESS,
        backgroundColor: ANALYTICS_CHART_SUCCESS_AREA,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: ANALYTICS_CHART_SUCCESS,
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <Line
        key={chartKey}
        data={data}
        plugins={[pointLabelsPlugin]}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  `${label}: ${formatAnalyticsPercent(Number(ctx.parsed.y), false)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: ANALYTICS_CHART_TEXT, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
              beginAtZero: true,
              max: asPercent ? 100 : undefined,
              grid: { color: ANALYTICS_CHART_GRID },
              ticks: {
                color: ANALYTICS_CHART_TEXT,
                callback: (value) => (asPercent ? `${value}%` : String(value)),
              },
            },
          },
        }}
      />
    </div>
  );
}
