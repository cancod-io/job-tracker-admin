import { chartViewLabel, type AnalyticsChartView } from "@/lib/analytics-chart-view";
import { granularityBucketLabel } from "@/lib/analytics-utils";
import type { AnalyticsGranularity } from "@/types/admin-analytics-api";

type AnalyticsTimeseriesMetaProps = {
  view?: AnalyticsChartView;
  granularity: AnalyticsGranularity;
  pointCount: number;
  className?: string;
};

export function AnalyticsTimeseriesMeta({
  view,
  granularity,
  pointCount,
  className,
}: AnalyticsTimeseriesMetaProps) {
  if (pointCount === 0) return null;

  const viewLabel = view ? chartViewLabel(view) : null;

  return (
    <p className={className ?? "text-xs text-muted-foreground"}>
      {viewLabel ? `${viewLabel} · ` : ""}
      {granularityBucketLabel(granularity, pointCount)}
    </p>
  );
}
