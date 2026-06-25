import {
  dateKeyToAnalyticsToExclusiveUtc,
  dateKeyToPostedFromUtc,
  toDateKey,
} from "@/lib/date-utils";
import type { AnalyticsGranularity, AnalyticsQueryParams } from "@/types/admin-analytics-api";

export type AnalyticsChartView = "today" | "day" | "week" | "month";

export const ANALYTICS_CHART_VIEW_OPTIONS: { value: AnalyticsChartView; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

export function chartViewLabel(view: AnalyticsChartView): string {
  return ANALYTICS_CHART_VIEW_OPTIONS.find((option) => option.value === view)?.label ?? view;
}

/** Map per-chart view onto API query params (today overrides the global date range). */
export function chartViewToApiParams(
  baseParams: AnalyticsQueryParams,
  view: AnalyticsChartView,
): AnalyticsQueryParams {
  const { granularity: _granularity, ...rest } = baseParams;

  if (view === "today") {
    const today = toDateKey(new Date());
    return {
      ...rest,
      from: dateKeyToPostedFromUtc(today),
      to: dateKeyToAnalyticsToExclusiveUtc(today),
      granularity: "day",
    };
  }

  const granularity: AnalyticsGranularity =
    view === "month" ? "month" : view === "week" ? "week" : "day";

  return {
    ...rest,
    granularity,
  };
}

export function chartViewToGranularity(view: AnalyticsChartView): AnalyticsGranularity {
  if (view === "month") return "month";
  if (view === "week") return "week";
  return "day";
}
