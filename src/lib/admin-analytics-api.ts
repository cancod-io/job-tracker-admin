/**
 * Analytics aggregate endpoints (Phases 1–4).
 */
import { apiUrl } from "@/lib/api";
import { formatApplicantStatus } from "@/lib/applicant-status";
import {
  FUNNEL_CANONICAL_STAGES,
  funnelStageShare,
  normalizeFunnelStatusKey,
} from "@/lib/analytics-utils";
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { API_PATHS } from "@/lib/api-paths";
import { isHiddenScraperProvider } from "@/lib/scraper-provider-utils";
import type {
  AnalyticsAlertsResponse,
  AnalyticsAlert,
  AnalyticsApplicationsFunnel,
  AnalyticsApplicationsTimeseries,
  AnalyticsCountRow,
  AnalyticsFetchRunsSummary,
  AnalyticsFetchRunsTimeseries,
  AnalyticsGranularity,
  AnalyticsHealth,
  AnalyticsHealthStatus,
  AnalyticsIngestHealth,
  AnalyticsJobsBreakdown,
  AnalyticsNotificationsSummary,
  AnalyticsOverview,
  AnalyticsQueryParams,
  AnalyticsScraperLogsResponse,
  AnalyticsScrapingProviderSummary,
  AnalyticsScrapingSummary,
  AnalyticsScrapingTimeseries,
  AnalyticsTargetsSummary,
  AnalyticsTimeseries,
  AnalyticsUserPipeline,
  AnalyticsUsersSummary,
  AnalyticsCeleryStatus,
} from "@/types/admin-analytics-api";

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function numOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeGranularity(value: unknown): AnalyticsGranularity {
  if (value === "week" || value === "month") return value;
  return "day";
}

function providerDisplayLabel(
  item: Record<string, unknown>,
  fallbackProvider: string,
): { provider_label: string | null; label: string } {
  const providerLabel = str(item.provider_label) || str(item.label) || null;
  return {
    provider_label: providerLabel,
    label: providerLabel ?? fallbackProvider,
  };
}

function buildQuery(params: AnalyticsQueryParams = {}): string {
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.source?.trim()) search.set("source", params.source.trim());
  if (params.granularity) search.set("granularity", params.granularity);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  if (params.provider?.trim()) search.set("provider", params.provider.trim());
  if (params.status?.trim()) search.set("status", params.status.trim());
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Query string for applications timeseries (BE: from, to, granularity, optional source). */
function buildApplicationsTimeseriesQuery(params: AnalyticsQueryParams = {}): string {
  return buildQuery(params);
}

function normalizeCountRow(raw: unknown, keyField = "key", labelField = "label"): AnalyticsCountRow | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const key = str(r[keyField]) || str(r.source) || str(r.name) || str(r.status) || str(r.job_type);
  if (!key) return null;
  return {
    key,
    label: str(r[labelField]) || str(r.source_label) || key,
    count: num(r.count),
  };
}

function normalizeCountRows(raw: unknown, keyField?: string, labelField?: string): AnalyticsCountRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeCountRow(item, keyField, labelField))
    .filter((row): row is AnalyticsCountRow => row != null);
}

function normalizeOverview(raw: Record<string, unknown>): AnalyticsOverview {
  return {
    total_jobs: num(raw.total_jobs),
    new_jobs: num(raw.new_jobs ?? raw.new_jobs_today),
    jobs_added_in_range: num(raw.jobs_added_in_range ?? raw.jobs_added),
    total_applications: num(raw.total_applications),
    applications_in_range: num(raw.applications_in_range ?? raw.applications_added),
    active_users: num(raw.active_users),
    pending_approvals: num(raw.pending_approvals),
    scraper_success_rate_7d: numOrNull(raw.scraper_success_rate_7d ?? raw.scraper_success_rate),
  };
}

function normalizeJobsBreakdown(raw: Record<string, unknown>): AnalyticsJobsBreakdown {
  const byIsNewRaw = Array.isArray(raw.by_is_new) ? raw.by_is_new : [];

  return {
    by_source: normalizeCountRows(raw.by_source),
    by_is_new: byIsNewRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        is_new:
          item.is_new === true || item.is_new === false
            ? item.is_new === true
            : parseTruthyKey(item.key),
        count: num(item.count),
      })),
    by_job_type: normalizeCountRows(raw.by_job_type, "key", "key"),
    top_companies: normalizeCountRows(raw.top_companies, "key", "key"),
    top_locations: normalizeCountRows(raw.top_locations, "key", "key"),
  };
}

function normalizeConversionRates(raw: unknown): AnalyticsApplicationsFunnel["conversion_rates"] {
  if (typeof raw !== "object" || raw === null) return undefined;
  const rates = raw as Record<string, unknown>;
  return {
    interview_rate: numOrNull(rates.interview_rate),
    offer_rate: numOrNull(rates.offer_rate),
    failure_rate: numOrNull(rates.failure_rate),
  };
}

function normalizeFunnel(raw: Record<string, unknown>): AnalyticsApplicationsFunnel {
  const conversion_rates = normalizeConversionRates(raw.conversion_rates);
  const byStatusRaw = Array.isArray(raw.by_status) ? raw.by_status : [];
  const statusMap = new Map<string, number>();

  for (const item of byStatusRaw) {
    if (typeof item !== "object" || item === null) continue;
    const row = item as Record<string, unknown>;
    const status = str(row.key) || str(row.status);
    if (!status) continue;
    const canonical = normalizeFunnelStatusKey(status);
    if (!canonical) continue;
    statusMap.set(canonical, (statusMap.get(canonical) ?? 0) + num(row.count));
  }

  if (byStatusRaw.length > 0) {
    const total = num(raw.total, [...statusMap.values()].reduce((sum, count) => sum + count, 0));
    const stages = FUNNEL_CANONICAL_STAGES.map((status) => {
      const count = statusMap.get(status) ?? 0;
      return {
        status,
        label: formatApplicantStatus(status),
        count,
        conversion_rate: funnelStageShare(count, total),
      };
    });

    return {
      stages,
      total,
      conversion_rates,
    };
  }

  const stagesRaw = Array.isArray(raw.stages) ? raw.stages : [];
  const legacyMap = new Map<string, number>();

  for (const item of stagesRaw) {
    if (typeof item !== "object" || item === null) continue;
    const row = item as Record<string, unknown>;
    const status = str(row.status) || str(row.key);
    const canonical = normalizeFunnelStatusKey(status);
    if (!canonical) continue;
    legacyMap.set(canonical, (legacyMap.get(canonical) ?? 0) + num(row.count));
  }

  const total = num(raw.total, [...legacyMap.values()].reduce((sum, count) => sum + count, 0));
  const stages = FUNNEL_CANONICAL_STAGES.map((status) => {
    const count = legacyMap.get(status) ?? 0;
    return {
      status,
      label: formatApplicantStatus(status),
      count,
      conversion_rate: funnelStageShare(count, total),
    };
  });

  return {
    stages,
    total,
    conversion_rates,
  };
}

function parseTruthyKey(value: unknown): boolean {
  if (value === true) return true;
  if (value === false) return false;
  const key = str(value).toLowerCase();
  return key === "true" || key === "1" || key === "yes";
}

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function normalizeUsersSummary(raw: Record<string, unknown>): AnalyticsUsersSummary {
  const byActiveRaw = Array.isArray(raw.by_active) ? raw.by_active : [];
  const byVerifiedRaw = Array.isArray(raw.by_email_verified) ? raw.by_email_verified : [];

  const by_role = normalizeCountRows(raw.by_role, "key", "key").map((row) => ({
    ...row,
    label: roleLabelFromKey(row.key) || row.label,
  }));

  const by_approval_status = normalizeCountRows(raw.by_approval_status, "key", "key").map((row) => ({
    ...row,
    label: APPROVAL_STATUS_LABELS[row.key.toLowerCase()] ?? row.label ?? row.key,
  }));

  const by_active = byActiveRaw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      active:
        item.active === true || item.active === false
          ? item.active === true
          : parseTruthyKey(item.key),
      count: num(item.count),
    }));

  let email_verified = num(raw.email_verified);
  let email_unverified = num(raw.email_unverified);

  if (email_verified === 0 && email_unverified === 0 && byVerifiedRaw.length > 0) {
    for (const item of byVerifiedRaw) {
      if (typeof item !== "object" || item === null) continue;
      const verified =
        item.verified === true ||
        item.email_verified === true ||
        parseTruthyKey(item.key);
      const count = num(item.count);
      if (verified) email_verified += count;
      else email_unverified += count;
    }
  }

  return {
    by_role,
    by_approval_status,
    by_active,
    email_verified,
    email_unverified,
    total_users: num(raw.total_users ?? raw.total),
  };
}

function roleLabelFromKey(role: string): string {
  const labels: Record<string, string> = {
    admin: "Admin",
    moderator: "Moderator",
    user: "User",
    super_admin: "Super Admin",
    bidder: "Bidder",
  };
  return labels[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeTimeseries(raw: Record<string, unknown>): AnalyticsTimeseries {
  const seriesRaw = Array.isArray(raw.series) ? raw.series : Array.isArray(raw.data) ? raw.data : [];
  const granularity = normalizeGranularity(raw.granularity);

  const series = seriesRaw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const pointsRaw = Array.isArray(item.points) ? item.points : [];
      return {
        key: str(item.key) || str(item.source) || str(item.label, "series"),
        label: str(item.label) || str(item.key) || str(item.source, "Series"),
        points: pointsRaw
          .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
          .map((p) => ({
            date: str(p.date) || str(p.day) || str(p.bucket),
            count: num(p.count ?? p.value ?? p.total),
          }))
          .filter((p) => p.date),
      };
    });

  return { granularity, series };
}

function normalizeFetchRunsSummary(raw: Record<string, unknown>): AnalyticsFetchRunsSummary {
  const sourcesRaw = Array.isArray(raw.sources) ? raw.sources : [];
  return {
    sources: sourcesRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        source: str(item.source),
        label: str(item.label, str(item.source)),
        last_run_at: str(item.last_run_at) || null,
        last_status: str(item.last_status) || null,
        total_added: num(item.total_added),
        total_updated: num(item.total_updated),
        total_removed: num(item.total_removed),
        total_unchanged: num(item.total_unchanged),
        success_rate: numOrNull(item.success_rate),
        notification_sent_at: str(item.notification_sent_at) || null,
      }))
      .filter((s) => s.source),
  };
}

function normalizeFetchRunsTimeseries(raw: Record<string, unknown>): AnalyticsFetchRunsTimeseries {
  const seriesRaw = Array.isArray(raw.series) ? raw.series : [];
  return {
    granularity: normalizeGranularity(raw.granularity),
    series: seriesRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => {
        const pointsRaw = Array.isArray(item.points) ? item.points : [];
        return {
          source: str(item.source),
          label: str(item.label, str(item.source)),
          points: pointsRaw
            .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
            .map((p) => ({
              date: str(p.date) || str(p.day),
              added: num(p.added),
              updated: num(p.updated),
              unchanged: num(p.unchanged),
              removed: num(p.removed),
            }))
            .filter((p) => p.date),
        };
      })
      .filter((s) => s.source),
  };
}

function normalizeUserPipeline(raw: Record<string, unknown>): AnalyticsUserPipeline {
  const recentRaw = Array.isArray(raw.recent_applications) ? raw.recent_applications : [];
  return {
    user_id: num(raw.user_id),
    status_counts: normalizeCountRows(raw.status_counts, "status", "label"),
    recent_applications: recentRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        id: num(item.id),
        job_title: str(item.job_title, "—"),
        company: str(item.company, "—"),
        status: str(item.status),
        applied_at: str(item.applied_at),
      })),
    follow_ups_due: num(raw.follow_ups_due),
  };
}

function normalizeByStatusMap(raw: unknown): Record<string, number> {
  if (typeof raw !== "object" || raw === null) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    result[key] = num(value);
  }
  return result;
}

function normalizeScrapingProviderRow(item: Record<string, unknown>): AnalyticsScrapingProviderSummary {
  const totalRuns = num(item.total_runs ?? item.run_count);
  const provider = str(item.provider);
  const { provider_label, label } = providerDisplayLabel(item, provider);
  return {
    provider,
    provider_label,
    label,
    success_rate: numOrNull(item.success_rate),
    avg_duration_ms: numOrNull(item.avg_duration_ms),
    last_run_at: str(item.last_run_at) || null,
    last_status: str(item.last_status) || null,
    run_count: totalRuns,
    total_runs: totalRuns,
    success_count: num(item.success_count),
    failed_count: num(item.failed_count),
    cancelled_count: num(item.cancelled_count),
    added_count: num(item.added_count),
    updated_count: num(item.updated_count),
    unchanged_count: num(item.unchanged_count),
    removed_count: num(item.removed_count),
    blocked_count: num(item.blocked_count),
  };
}

function normalizeApplicationsTimeseries(
  raw: Record<string, unknown>,
): AnalyticsApplicationsTimeseries {
  const seriesRaw = Array.isArray(raw.series) ? raw.series : [];
  const series = seriesRaw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      date: str(item.date) || str(item.day),
      total: num(item.total ?? item.count),
      by_status: normalizeByStatusMap(item.by_status),
    }))
    .filter((point) => point.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    period_from: str(raw.period_from) || null,
    period_to: str(raw.period_to) || null,
    granularity: normalizeGranularity(raw.granularity),
    series,
  };
}

function normalizeScrapingTimeseries(raw: Record<string, unknown>): AnalyticsScrapingTimeseries {
  const seriesRaw = Array.isArray(raw.series) ? raw.series : [];
  const byProviderRaw = Array.isArray(raw.by_provider) ? raw.by_provider : [];

  const providerLabels = new Map<string, string>();
  for (const item of byProviderRaw) {
    if (typeof item !== "object" || item === null) continue;
    const row = item as Record<string, unknown>;
    const provider = str(row.provider);
    if (provider) {
      const { label } = providerDisplayLabel(row, provider);
      if (isHiddenScraperProvider(provider, label)) continue;
      providerLabels.set(provider, label);
    }
  }

  return {
    period_from: str(raw.period_from) || null,
    period_to: str(raw.period_to) || null,
    granularity: normalizeGranularity(raw.granularity),
    series: seriesRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => {
        const provider = str(item.provider);
        const { provider_label, label } = providerDisplayLabel(
          item,
          providerLabels.get(provider) ?? provider,
        );
        return {
          date: str(item.date) || str(item.day),
          provider,
          provider_label: provider_label ?? label,
          label,
          total_runs: num(item.total_runs),
          success_count: num(item.success_count),
          failed_count: num(item.failed_count),
          cancelled_count: num(item.cancelled_count),
          success_rate: numOrNull(item.success_rate),
          avg_duration_ms: numOrNull(item.avg_duration_ms),
          added_count: num(item.added_count),
          updated_count: num(item.updated_count),
          unchanged_count: num(item.unchanged_count),
          removed_count: num(item.removed_count),
          blocked_count: num(item.blocked_count),
        };
      })
      .filter(
        (point) =>
          point.date &&
          point.provider &&
          !isHiddenScraperProvider(point.provider, point.label || point.provider_label),
      ),
    by_provider: byProviderRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => normalizeScrapingProviderRow(item))
      .filter(
        (provider) =>
          provider.provider && !isHiddenScraperProvider(provider.provider, provider.label),
      ),
  };
}

function normalizeScrapingSummary(raw: Record<string, unknown>): AnalyticsScrapingSummary {
  const byProviderRaw = Array.isArray(raw.by_provider) ? raw.by_provider : [];

  return {
    period_from: str(raw.period_from) || null,
    period_to: str(raw.period_to) || null,
    total_runs: num(raw.total_runs),
    success_rate: numOrNull(raw.success_rate),
    avg_duration_ms: numOrNull(raw.avg_duration_ms),
    by_provider: byProviderRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => normalizeScrapingProviderRow(item))
      .filter(
        (p) => p.provider && !isHiddenScraperProvider(p.provider, p.label),
      ),
  };
}

function normalizeIngestHealth(raw: Record<string, unknown>): AnalyticsIngestHealth {
  return {
    created_rate: numOrNull(raw.created_rate),
    updated_rate: numOrNull(raw.updated_rate),
    blocked_rate: numOrNull(raw.blocked_rate),
    failed_rate: numOrNull(raw.failed_rate),
    total_batches: num(raw.total_batches),
    window_hours: num(raw.window_hours, 24),
  };
}

function normalizeScraperLogs(raw: Record<string, unknown>): AnalyticsScraperLogsResponse {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  return {
    items: itemsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        id: num(item.id),
        name: str(item.name, "—"),
        status: str(item.status),
        duration_ms: numOrNull(item.duration_ms),
        error_message: str(item.error_message) || null,
        started_at: str(item.started_at),
        finished_at: str(item.finished_at) || null,
      }))
      .filter((item) => !isHiddenScraperProvider(item.name, item.name)),
    total: num(raw.total),
    limit: num(raw.limit, 20),
    offset: num(raw.offset),
  };
}

function normalizeCeleryStatus(raw: Record<string, unknown>): AnalyticsCeleryStatus {
  const queuesRaw = Array.isArray(raw.queues) ? raw.queues : [];
  return {
    queues: queuesRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        name: str(item.name),
        depth: num(item.depth),
      }))
      .filter((q) => q.name),
    active_tasks: num(raw.active_tasks),
    failed_tasks_24h: num(raw.failed_tasks_24h),
    last_beat_at: str(raw.last_beat_at) || null,
    workers_online: num(raw.workers_online),
  };
}

function normalizeTargetsSummary(raw: Record<string, unknown>): AnalyticsTargetsSummary {
  const companies = (raw.companies ?? {}) as Record<string, unknown>;
  const careerUrls = (raw.career_urls ?? {}) as Record<string, unknown>;
  const scamUrls = (raw.scam_urls ?? {}) as Record<string, unknown>;

  return {
    companies: { total: num(companies.total), stale: num(companies.stale) },
    career_urls: { total: num(careerUrls.total), stale: num(careerUrls.stale) },
    scam_urls: { total: num(scamUrls.total) },
  };
}

function normalizeNotificationsSummary(raw: Record<string, unknown>): AnalyticsNotificationsSummary {
  return {
    digests_sent: num(raw.digests_sent),
    digests_pending: num(raw.digests_pending),
    last_sent_at: str(raw.last_sent_at) || null,
  };
}

function normalizeHealthStatus(value: unknown): AnalyticsHealthStatus {
  if (value === "green" || value === "yellow" || value === "red") return value;
  return "yellow";
}

function normalizeAlertSeverity(value: unknown): AnalyticsAlert["severity"] {
  if (value === "info" || value === "warning" || value === "error") return value;
  return "warning";
}

function normalizeHealth(raw: Record<string, unknown>): AnalyticsHealth {
  const subsystemsRaw = Array.isArray(raw.subsystems) ? raw.subsystems : [];

  return {
    overall: normalizeHealthStatus(raw.overall),
    subsystems: subsystemsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        key: str(item.key),
        label: str(item.label, str(item.key)),
        status: normalizeHealthStatus(item.status),
        message: str(item.message) || null,
      }))
      .filter((s) => s.key),
  };
}

function normalizeAlerts(raw: Record<string, unknown>): AnalyticsAlertsResponse {
  const alertsRaw = Array.isArray(raw.alerts) ? raw.alerts : [];
  return {
    alerts: alertsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        id: str(item.id),
        severity: normalizeAlertSeverity(item.severity),
        title: str(item.title, "Alert"),
        message: str(item.message),
        href: str(item.href) || null,
      }))
      .filter((a) => a.id),
  };
}

// Phase 1

export async function getAnalyticsOverview(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsOverview> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.overview}${buildQuery(params)}`,
  );
  return normalizeOverview(raw);
}

export async function getAnalyticsJobsBreakdown(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsJobsBreakdown> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.jobsBreakdown}${buildQuery(params)}`,
  );
  return normalizeJobsBreakdown(raw);
}

export async function getAnalyticsApplicationsFunnel(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsApplicationsFunnel> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.applicationsFunnel}${buildQuery(params)}`,
  );
  return normalizeFunnel(raw);
}

export async function getAnalyticsUsersSummary(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsUsersSummary> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.usersSummary}${buildQuery(params)}`,
  );
  return normalizeUsersSummary(raw);
}

// Phase 2

export async function getAnalyticsJobsTimeseries(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsTimeseries> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.jobsTimeseries}${buildQuery(params)}`,
  );
  return normalizeTimeseries(raw);
}

export async function getAnalyticsApplicationsTimeseries(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsApplicationsTimeseries> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.applicationsTimeseries}${buildApplicationsTimeseriesQuery(params)}`,
  );
  return normalizeApplicationsTimeseries(raw);
}

export async function getAnalyticsUsersTimeseries(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsTimeseries> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.usersTimeseries}${buildQuery(params)}`,
  );
  return normalizeTimeseries(raw);
}

export async function getAnalyticsApplicationsBySource(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsCountRow[]> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.applicationsBySource}${buildQuery(params)}`,
  );
  if (Array.isArray(raw)) return normalizeCountRows(raw, "source", "label");
  return normalizeCountRows(raw.items ?? raw.by_source, "source", "label");
}

export async function getAnalyticsFetchRunsSummary(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsFetchRunsSummary> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.fetchRunsSummary}${buildQuery(params)}`,
  );
  return normalizeFetchRunsSummary(raw);
}

export async function getAnalyticsFetchRunsTimeseries(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsFetchRunsTimeseries> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.fetchRunsTimeseries}${buildQuery(params)}`,
  );
  return normalizeFetchRunsTimeseries(raw);
}

export async function getAnalyticsUserPipeline(
  token: string,
  userId: number,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsUserPipeline> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.userPipeline(userId)}${buildQuery(params)}`,
  );
  return normalizeUserPipeline(raw);
}

export async function getAnalyticsScrapingSummary(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsScrapingSummary> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.scrapingSummary}${buildQuery(params)}`,
  );
  return normalizeScrapingSummary(raw);
}

export async function getAnalyticsScrapingTimeseries(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsScrapingTimeseries> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.scrapingTimeseries}${buildQuery(params)}`,
  );
  return normalizeScrapingTimeseries(raw);
}

// Phase 3

export async function getAnalyticsIngestHealth(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsIngestHealth> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.scrapingIngestHealth}${buildQuery(params)}`,
  );
  return normalizeIngestHealth(raw);
}

export async function getAnalyticsScraperLogs(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsScraperLogsResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.workersScraperLogs}${buildQuery(params)}`,
  );
  return normalizeScraperLogs(raw);
}

export async function getAnalyticsCeleryStatus(
  token: string,
): Promise<AnalyticsCeleryStatus> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminAnalytics.workersCeleryStatus,
  );
  return normalizeCeleryStatus(raw);
}

export async function getAnalyticsTargetsSummary(
  token: string,
): Promise<AnalyticsTargetsSummary> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminAnalytics.targetsSummary,
  );
  return normalizeTargetsSummary(raw);
}

export async function getAnalyticsNotificationsSummary(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<AnalyticsNotificationsSummary> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminAnalytics.notificationsSummary}${buildQuery(params)}`,
  );
  return normalizeNotificationsSummary(raw);
}

export async function getAnalyticsHealth(token: string): Promise<AnalyticsHealth> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminAnalytics.health,
  );
  return normalizeHealth(raw);
}

// Phase 4

export async function getAnalyticsAlerts(token: string): Promise<AnalyticsAlertsResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminAnalytics.alerts,
  );
  return normalizeAlerts(raw);
}

export async function downloadAnalyticsExport(
  token: string,
  path: string,
  params: AnalyticsQueryParams,
  filename: string,
): Promise<void> {
  const url = apiUrl(`${path}${buildQuery(params)}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function exportAnalyticsOverview(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<void> {
  return downloadAnalyticsExport(
    token,
    API_PATHS.adminAnalytics.exportOverview,
    params,
    "analytics-overview.csv",
  );
}

export async function exportAnalyticsFunnel(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<void> {
  return downloadAnalyticsExport(
    token,
    API_PATHS.adminAnalytics.exportFunnel,
    params,
    "applications-funnel.csv",
  );
}

export async function exportAnalyticsScraperRuns(
  token: string,
  params: AnalyticsQueryParams = {},
): Promise<void> {
  return downloadAnalyticsExport(
    token,
    API_PATHS.adminAnalytics.exportScraperRuns,
    params,
    "scraper-runs.csv",
  );
}
