"use client";

import { AnalyticsLineChart } from "@/components/admin/analytics/charts/analytics-line-chart";
import {
  applicationsTimeseriesToPoints,
  formatAnalyticsNumber,
  granularityBucketLabel,
} from "@/lib/analytics-utils";
import { chartViewLabel, type AnalyticsChartView } from "@/lib/analytics-chart-view";
import type { AnalyticsApplicationsTimeseries } from "@/types/admin-analytics-api";

type AnalyticsApplicationsOverTimeChartProps = {
  timeseries: AnalyticsApplicationsTimeseries | null;
  view?: AnalyticsChartView;
  height?: number;
};

export function AnalyticsApplicationsOverTimeChart({
  timeseries,
  view,
  height = 220,
}: AnalyticsApplicationsOverTimeChartProps) {
  const points = applicationsTimeseriesToPoints(timeseries);

  if (points.length === 0) {
    return (
      <p
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        No application trend data for this range.
      </p>
    );
  }

  const rangeTotal = points.reduce((sum, point) => sum + point.value, 0);
  const granularity = timeseries?.granularity ?? "day";
  const viewLabel = view ? chartViewLabel(view) : null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {viewLabel ? `${viewLabel} · ` : ""}
        {formatAnalyticsNumber(rangeTotal)} applications across{" "}
        {granularityBucketLabel(granularity, points.length)}
      </p>
      <AnalyticsLineChart
        points={points}
        label="Applications"
        color="#8B5CF6"
        height={height}
      />
    </div>
  );
}
