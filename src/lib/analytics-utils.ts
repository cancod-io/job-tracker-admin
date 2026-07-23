import {
  dateKeyToAnalyticsToExclusiveUtc,
  dateKeyToPostedFromUtc,
  parseDateKey,
  toDateKey,
} from "@/lib/date-utils";
import { formatJobSourceLabel } from "@/lib/job-source-utils";
import { formatScraperProviderLabel, isHiddenScraperProvider } from "@/lib/scraper-provider-utils";
import { roleLabel } from "@/lib/user-approval";
import type {
  AnalyticsApplicationsTimeseries,
  AnalyticsCountRow,
  AnalyticsGranularity,
  AnalyticsQueryParams,
  AnalyticsScrapingTimeseries,
  AnalyticsScrapingTimeseriesPoint,
  AnalyticsUsersSummary,
} from "@/types/admin-analytics-api";

export function formatAnalyticsNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatAnalyticsPercent(value: number | null, asRatio = false): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const pct = asRatio && value <= 1 ? value * 100 : value;
  return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
}

export function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
  return ((current - previous) / previous) * 100;
}

export function previousPeriodRange(from: string, to: string): { from: string; to: string } {
  const fromDate = parseDateKey(from);
  const toDate = parseDateKey(to);
  if (!fromDate || !toDate) return { from, to };

  const dayMs = 24 * 60 * 60 * 1000;
  const spanDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / dayMs) + 1);
  const prevTo = new Date(fromDate);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (spanDays - 1));

  return { from: toDateKey(prevFrom), to: toDateKey(prevTo) };
}

export function previousPeriodApiParams(params: AnalyticsQueryParams): AnalyticsQueryParams | null {
  if (!params.from || !params.to) return null;
  const fromKey = params.from.slice(0, 10);
  const toKey = params.to.slice(0, 10);
  const prev = previousPeriodRange(fromKey, toKey);
  return {
    ...params,
    from: dateKeyToPostedFromUtc(prev.from),
    to: dateKeyToAnalyticsToExclusiveUtc(prev.to),
  };
}

/** Pick chart bucket size from inclusive calendar-day span (handover UX). */
export function resolveAnalyticsGranularity(fromKey: string, toKey: string): AnalyticsGranularity {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (!from || !to) return "day";

  const dayMs = 24 * 60 * 60 * 1000;
  const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / dayMs) + 1);
  if (spanDays <= 31) return "day";
  if (spanDays <= 93) return "week";
  return "month";
}

export function granularityBucketLabel(
  granularity: AnalyticsGranularity,
  count: number,
): string {
  const unit = granularity === "day" ? "day" : granularity === "week" ? "week" : "month";
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

export function granularityViewLabel(granularity: AnalyticsGranularity): string {
  switch (granularity) {
    case "week":
      return "Weekly view";
    case "month":
      return "Monthly view";
    default:
      return "Daily view";
  }
}

export function formatJobTypeLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Top sources for donut charts — labels come from the API (`label` / `source_label`). */
export function buildSourceDonutSlices(rows: AnalyticsCountRow[]): DonutSlice[] {
  const slices = rows
    .filter((row) => row.count > 0)
    .map((row) => ({
      id: row.key,
      label: formatJobSourceLabel(row.key, row.label),
      value: row.count,
    }))
    .sort((a, b) => b.value - a.value);

  return aggregateDonutSlices(slices);
}

const JOB_TYPE_BUCKET_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  other: "Other",
};

function jobTypeBucket(key: string): string {
  const k = key.toLowerCase().replace(/_/g, " ");

  if (k === "unknown" || k === "unavailable") return "other";
  if (k.includes("intern") || k === "student") return "internship";
  if (/full/.test(k) && /part/.test(k)) return "full_time";
  if (/part[\s-]?time/.test(k)) return "part_time";
  if (/full[\s-]?time|salaried ft|festanstellung|permanent employee/.test(k)) return "full_time";
  if (/contract|contractor|freelance|self employed|employment contract/.test(k)) return "contract";

  return "other";
}

/** Group raw job-type keys into mockup-style buckets (Full-time, Part-time, Contract, Internship, Other). */
export function buildJobTypeDonutSlices(rows: AnalyticsCountRow[]): DonutSlice[] {
  const buckets = new Map<string, number>();
  for (const row of rows) {
    const bucket = jobTypeBucket(row.key);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + row.count);
  }

  const order = ["full_time", "part_time", "contract", "internship", "other"] as const;
  return order
    .filter((id) => (buckets.get(id) ?? 0) > 0)
    .map((id) => ({
      id,
      label: JOB_TYPE_BUCKET_LABELS[id] ?? id,
      value: buckets.get(id) ?? 0,
    }));
}

export function buildNewVsOldDonutSlices(
  rows: { is_new: boolean; count: number }[],
): DonutSlice[] {
  const newCount = rows.filter((row) => row.is_new).reduce((sum, row) => sum + row.count, 0);
  const oldCount = rows.filter((row) => !row.is_new).reduce((sum, row) => sum + row.count, 0);

  return aggregateDonutSlices([
    { id: "new", label: "New Jobs", value: newCount },
    { id: "old", label: "Old Jobs", value: oldCount },
  ]);
}

export function sharePercent(count: number, total: number): number {
  if (!total) return 0;
  return (count / total) * 100;
}

export function shortDateLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return iso.slice(0, 10);
  }
}

export type DonutSlice = {
  id: string;
  label: string;
  value: number;
};

/** Merge slices that share the same id/label so chart legends stay unique. */
export function aggregateDonutSlices(
  slices: { id?: string; label: string; value: number }[],
): DonutSlice[] {
  const map = new Map<string, DonutSlice>();
  for (const slice of slices) {
    const id = slice.id ?? slice.label;
    const existing = map.get(id);
    if (existing) {
      existing.value += slice.value;
    } else {
      map.set(id, { id, label: slice.label, value: slice.value });
    }
  }
  return [...map.values()].filter((slice) => slice.value > 0);
}

/** Canonical application funnel stages shown in analytics (in pipeline order). */
export const FUNNEL_CANONICAL_STAGES = [
  "applied",
  "interviewing",
  "offer",
  "failed",
] as const;

export type FunnelCanonicalStage = (typeof FUNNEL_CANONICAL_STAGES)[number];

/** Map API status keys onto canonical funnel stages. */
export function normalizeFunnelStatusKey(status: string): FunnelCanonicalStage | null {
  switch (status) {
    case "applied":
    case "interviewing":
    case "offer":
    case "offered":
    case "failed":
    case "rejected":
      if (status === "offered") return "offer";
      if (status === "rejected") return "failed";
      return status;
    case "screening":
    case "hired":
      return null;
    default:
      return null;
  }
}

/** Share of all applications in range (mockup-style conversion column). */
export function funnelStageShare(count: number, total: number): number | null {
  if (!Number.isFinite(count) || !Number.isFinite(total) || total <= 0) return null;
  return count / total;
}

/**
 * Polar-area display value: sqrt scaling keeps small stages visible next to Applied,
 * with a floor so zero-count stages still render a wedge.
 */
export function funnelPolarDisplayValue(count: number): number {
  if (count > 0) return Math.sqrt(count);
  return 0.4;
}

/** Line chart points from applications timeseries (`series[].total`). */
export function applicationsTimeseriesToPoints(
  timeseries: AnalyticsApplicationsTimeseries | null | undefined,
): { date: string; value: number }[] {
  if (!timeseries?.series.length) return [];
  return timeseries.series.map((point) => ({
    date: point.date,
    value: point.total,
  }));
}

export type ScrapingProviderRateSeries = {
  provider: string;
  label: string;
  color: string;
  points: {
    date: string;
    success_rate: number | null;
    total_runs: number;
    success_count: number;
    failed_count: number;
    added_count: number;
    avg_duration_ms: number | null;
  }[];
};

/** Y-axis bounds that zoom in when rates cluster (e.g. all at 100%). */
export function resolveSuccessRateYBounds(series: ScrapingProviderRateSeries[]): {
  min: number;
  max: number;
} {
  const values: number[] = [];
  for (const providerSeries of series) {
    for (const point of providerSeries.points) {
      if (point.success_rate != null) values.push(point.success_rate * 100);
    }
  }

  if (values.length === 0) return { min: 0, max: 100 };

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const spread = dataMax - dataMin;

  if (spread < 1) {
    const center = dataMax;
    return {
      min: Math.max(0, Math.floor(center - 15)),
      max: Math.min(100, Math.ceil(center + 2)),
    };
  }

  if (dataMin >= 40 && spread <= 50) {
    const padding = Math.max(10, spread * 0.2);
    return {
      min: Math.max(0, Math.floor(dataMin - padding)),
      max: Math.min(100, Math.ceil(dataMax + Math.min(5, padding / 2))),
    };
  }

  return { min: 0, max: 100 };
}

export const SCRAPER_SUCCESS_LINE_DASHES: (number[] | undefined)[] = [
  undefined,
  [6, 4],
  [2, 3],
  [8, 4, 2, 4],
];

const SCRAPER_PROVIDER_CHART_COLORS: Record<string, string> = {
  serpapi: "#0EA5E9",
  theirstack: "#F59E0B",
};

const SCRAPER_PROVIDER_CHART_FALLBACK = [
  "#0EA5E9",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
] as const;

function scrapingProviderOrder(timeseries: AnalyticsScrapingTimeseries): string[] {
  const fromSummary = timeseries.by_provider.map((row) => row.provider).filter(Boolean);
  const fromSeries = [...new Set(timeseries.series.map((row) => row.provider).filter(Boolean))];
  const seen = new Set<string>();
  const order: string[] = [];

  for (const provider of [...fromSummary, ...fromSeries]) {
    if (!provider || seen.has(provider)) continue;
    if (isHiddenScraperProvider(provider)) continue;
    seen.add(provider);
    order.push(provider);
  }

  return order;
}

function scraperProviderChartColor(provider: string, index: number): string {
  return (
    SCRAPER_PROVIDER_CHART_COLORS[provider] ??
    SCRAPER_PROVIDER_CHART_FALLBACK[index % SCRAPER_PROVIDER_CHART_FALLBACK.length] ??
    "#10B981"
  );
}

/** Group scraping timeseries rows by provider (handover helper). */
export function groupScrapingByProvider(series: AnalyticsScrapingTimeseriesPoint[]) {
  const map = new Map<string, AnalyticsScrapingTimeseriesPoint[]>();
  for (const point of series) {
    const bucket = map.get(point.provider) ?? [];
    bucket.push(point);
    map.set(point.provider, bucket);
  }
  return [...map.entries()].map(([provider, points]) => ({
    provider,
    label: points[0]?.provider_label ?? points[0]?.label ?? provider,
    points: points.sort((a, b) => a.date.localeCompare(b.date)),
  }));
}

/** Group scraping timeseries rows into one series per provider for multi-line charts. */
export function buildScrapingProviderRateSeries(
  timeseries: AnalyticsScrapingTimeseries | null | undefined,
): ScrapingProviderRateSeries[] {
  if (!timeseries?.series.length) return [];

  const grouped = groupScrapingByProvider(timeseries.series);
  const groupedMap = new Map(grouped.map((entry) => [entry.provider, entry]));
  const providerOrder = scrapingProviderOrder(timeseries);
  const dates = [...new Set(timeseries.series.map((row) => row.date))].sort();

  return providerOrder.map((provider, index) => {
    const group = groupedMap.get(provider);
    const label =
      timeseries.by_provider.find((row) => row.provider === provider)?.label ??
      group?.label ??
      formatScraperProviderLabel(provider);
    const pointMap = new Map(group?.points.map((point) => [point.date, point]) ?? []);

    return {
      provider,
      label,
      color: scraperProviderChartColor(provider, index),
      points: dates.map((date) => {
        const row = pointMap.get(date);
        return {
          date,
          success_rate: row?.success_rate ?? null,
          total_runs: row?.total_runs ?? 0,
          success_count: row?.success_count ?? 0,
          failed_count: row?.failed_count ?? 0,
          added_count: row?.added_count ?? 0,
          avg_duration_ms: row?.avg_duration_ms ?? null,
        };
      }),
    };
  }).filter((providerSeries) =>
    providerSeries.points.some(
      (point) => point.success_rate != null || point.total_runs > 0,
    ),
  );
}

export type UserSummaryQuadrant = {
  title: string;
  rows: { label: string; count: number }[];
};

export function buildUserSummaryQuadrants(users: AnalyticsUsersSummary): UserSummaryQuadrant[] {
  const active = users.by_active.find((r) => r.active)?.count ?? 0;
  const inactive = users.by_active.find((r) => !r.active)?.count ?? 0;

  return [
    {
      title: "By Role",
      rows: users.by_role.map((r) => ({
        label: roleLabel(r.key) || r.label,
        count: r.count,
      })),
    },
    {
      title: "Approval Status",
      rows: users.by_approval_status.map((r) => ({ label: r.label, count: r.count })),
    },
    {
      title: "Active Users",
      rows: [
        { label: "Active (30d)", count: active },
        { label: "Inactive (30d)", count: inactive },
      ],
    },
    {
      title: "Email Verified",
      rows: [
        { label: "Verified", count: users.email_verified },
        { label: "Unverified", count: users.email_unverified },
      ],
    },
  ];
}
