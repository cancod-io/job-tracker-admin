"use client";

import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import {
  formatAnalyticsPercent,
  resolveSuccessRateYBounds,
  SCRAPER_SUCCESS_LINE_DASHES,
  shortDateLabel,
  type ScrapingProviderRateSeries,
} from "@/lib/analytics-utils";
import { formatScraperRunDuration } from "@/lib/scraper-provider-utils";
import {
  ANALYTICS_CHART_GRID,
  ANALYTICS_CHART_TEXT,
} from "@/components/admin/analytics/charts/analytics-chart-theme";
import "@/components/admin/analytics/charts/analytics-chart-registry";

type AnalyticsScraperProviderRateChartProps = {
  series: ScrapingProviderRateSeries[];
  height?: number;
};

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AnalyticsScraperProviderRateChart({
  series,
  height = 220,
}: AnalyticsScraperProviderRateChartProps) {
  const chartKey = useMemo(
    () =>
      series
        .map((providerSeries) =>
          `${providerSeries.provider}:${providerSeries.points.map((p) => `${p.date}:${p.success_rate}`).join(",")}`,
        )
        .join("|"),
    [series],
  );

  const dates = useMemo(() => {
    const unique = new Set<string>();
    for (const providerSeries of series) {
      for (const point of providerSeries.points) unique.add(point.date);
    }
    return [...unique].sort();
  }, [series]);

  const yBounds = useMemo(() => resolveSuccessRateYBounds(series), [series]);

  if (series.length === 0 || dates.length === 0) {
    return (
      <p className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No scraper success trend data for this range.
      </p>
    );
  }

  const data = {
    labels: dates.map((date) => shortDateLabel(date)),
    datasets: series.map((providerSeries, seriesIndex) => {
      const validRateCount = providerSeries.points.filter(
        (point) => point.success_rate != null,
      ).length;
      const color = providerSeries.color;

      return {
        label: providerSeries.label,
        data: dates.map((date) => {
          const point = providerSeries.points.find((row) => row.date === date);
          return point?.success_rate == null ? null : point.success_rate * 100;
        }),
        borderColor: color,
        backgroundColor: withAlpha(color, 0.12),
        fill: validRateCount > 1 ? "origin" : false,
        tension: 0.3,
        pointRadius: validRateCount === 1 ? 7 : 4,
        pointHoverRadius: validRateCount === 1 ? 9 : 6,
        pointBackgroundColor: color,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointHitRadius: 10,
        borderWidth: 2.5,
        borderDash: SCRAPER_SUCCESS_LINE_DASHES[seriesIndex % SCRAPER_SUCCESS_LINE_DASHES.length],
        showLine: validRateCount > 1,
        spanGaps: validRateCount > 1,
        providerMeta: dates.map(
          (date) => providerSeries.points.find((row) => row.date === date) ?? null,
        ),
      };
    }),
  };

  const yTickStep = yBounds.max - yBounds.min <= 25 ? 5 : 10;

  return (
    <div style={{ height }}>
      <Line
        key={chartKey}
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: ANALYTICS_CHART_TEXT,
                boxWidth: 12,
                boxHeight: 3,
                usePointStyle: false,
                font: { size: 11 },
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const meta = (
                    ctx.dataset as {
                      providerMeta?: (ScrapingProviderRateSeries["points"][number] | null)[];
                    }
                  ).providerMeta?.[ctx.dataIndex];
                  const rateLabel =
                    meta?.success_rate != null
                      ? formatAnalyticsPercent(meta.success_rate, true)
                      : "—";
                  const lines = [`${ctx.dataset.label}: ${rateLabel}`];
                  if (meta) {
                    lines.push(`Runs: ${meta.total_runs}`);
                    if (meta.success_count > 0 || meta.failed_count > 0) {
                      lines.push(`Success: ${meta.success_count} · Failed: ${meta.failed_count}`);
                    }
                    lines.push(`Added: ${meta.added_count}`);
                    if (meta.avg_duration_ms != null) {
                      lines.push(`Avg duration: ${formatScraperRunDuration(meta.avg_duration_ms)}`);
                    }
                  }
                  return lines;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: ANALYTICS_CHART_TEXT, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
              min: yBounds.min,
              max: yBounds.max,
              grid: { color: ANALYTICS_CHART_GRID },
              border: { display: false },
              ticks: {
                color: ANALYTICS_CHART_TEXT,
                stepSize: yTickStep,
                callback: (value) => `${value}%`,
              },
            },
          },
        }}
      />
    </div>
  );
}
