/**
 * Job source, fetch-run history, and fetch-diff listing.
 *
 *   GET    /api/v1/jobs/sources
 *   GET    /api/v1/jobs/fetch-runs
 *   GET    /api/v1/jobs?source=…&fetch_change=…&fetch_run_id=…  (diff job cards)
 *   DELETE /api/admin/job-fetch-runs/{run_id}  (requires jobs.delete)
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import type { AdminJobDetail, AdminJobListResponse } from "@/types/admin-job-api";
import type {
  ApiFetchChangeType,
  ApiFetchRunsListResponse,
  FetchRunsListParams,
} from "@/types/api-fetch-runs";

type JobSourcesResponse = {
  sources?: string[];
};

type V1JobListItem = Partial<AdminJobDetail> & {
  id: number;
  title?: string;
  job_title?: string;
  updated_at?: string;
};

type V1JobListResponse = {
  items?: unknown;
  total?: unknown;
  limit?: unknown;
  offset?: unknown;
};

export type ListJobsFetchDiffParams = {
  page: number;
  page_size: number;
  source: string;
  fetch_change: ApiFetchChangeType;
  /** Omit to use the latest run for the source. */
  fetch_run_id?: number;
  q?: string;
};

function positiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function nonNegativeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function isV1JobItem(value: unknown): value is V1JobListItem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

/** Map `GET /api/v1/jobs` rows into the admin jobs table shape. */
function normalizeV1JobToAdminDetail(raw: V1JobListItem): AdminJobDetail {
  const createdAt = str(raw.created_at, new Date(0).toISOString());
  return {
    id: raw.id,
    source: str(raw.source),
    job_id: strOrNull(raw.job_id),
    apply_url: str(raw.apply_url, "#"),
    job_title: str(raw.job_title ?? raw.title, "Untitled role"),
    company: str(raw.company, "—"),
    company_logo_url: strOrNull(raw.company_logo_url),
    description: str(raw.description),
    location: strOrNull(raw.location),
    salary: strOrNull(raw.salary),
    job_type: strOrNull(raw.job_type),
    skills: Array.isArray(raw.skills)
      ? raw.skills.filter((s): s is string => typeof s === "string")
      : [],
    normalized_title: strOrNull(raw.normalized_title),
    is_new: Boolean(raw.is_new),
    posted_at: typeof raw.posted_at === "string" ? raw.posted_at : null,
    scraped_at: typeof raw.scraped_at === "string" ? raw.scraped_at : null,
    created_at: createdAt,
    updated_at: str(raw.updated_at, createdAt),
    applicants_total: nonNegativeInt(raw.applicants_total, 0),
    applicants_preview: [],
  };
}

export async function listJobSources(token: string): Promise<string[]> {
  const data = await fetchAuthedJson<JobSourcesResponse>(token, "/api/v1/jobs/sources");
  return (data.sources ?? []).map((s) => String(s).trim()).filter(Boolean);
}

export async function listFetchRuns(
  token: string,
  params: FetchRunsListParams,
): Promise<ApiFetchRunsListResponse> {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.page_size ?? 50),
  });
  const source = params.source?.trim();
  if (source) search.set("source", source);

  return fetchAuthedJson<ApiFetchRunsListResponse>(
    token,
    `/api/v1/jobs/fetch-runs?${search.toString()}`,
  );
}

/**
 * Full job cards for a fetch run + change type (`GET /api/v1/jobs`).
 * Requires `source` and `fetch_change`; `fetch_run_id` is optional (latest run when omitted).
 */
export async function listJobsForFetchDiff(
  token: string,
  params: ListJobsFetchDiffParams,
): Promise<AdminJobListResponse> {
  const pageSize = positiveInt(params.page_size, 20);
  const page = positiveInt(params.page, 1);
  const offset = (page - 1) * pageSize;

  const search = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
    source: params.source.trim(),
    fetch_change: params.fetch_change,
  });
  if (params.fetch_run_id != null) {
    search.set("fetch_run_id", String(params.fetch_run_id));
  }
  const q = params.q?.trim();
  if (q) search.set("q", q);

  const raw = await fetchAuthedJson<V1JobListResponse>(token, `/api/v1/jobs?${search}`);

  const limit = positiveInt(raw.limit, pageSize);
  const rawOffset = nonNegativeInt(raw.offset, offset);
  const total = nonNegativeInt(raw.total, 0);
  const resolvedPage = limit > 0 ? Math.floor(rawOffset / limit) + 1 : page;

  return {
    items: Array.isArray(raw.items)
      ? (raw.items as unknown[]).filter(isV1JobItem).map(normalizeV1JobToAdminDetail)
      : [],
    total,
    page: Math.max(1, resolvedPage),
    page_size: limit,
  };
}

/** Delete an ingest fetch run and its diff records. Requires `jobs.delete`. */
export async function deleteJobFetchRun(token: string, runId: number): Promise<void> {
  await fetchAuthedJson<void>(token, `/api/admin/job-fetch-runs/${runId}`, { method: "DELETE" });
}
