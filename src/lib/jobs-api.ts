/**
 * Client for `GET /api/v1/jobs` (limit/offset pagination, same contract as the main app).
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { normalizeAtsStatus } from "@/lib/job-ats";
import type { JobListItem, JobListResponse, JobListSort } from "@/types/job-api";

/** Raw list row shape from the Python API (fields vary by source). */
export type JobListApiItem = {
  id: number;
  job_title?: string;
  title?: string;
  company?: string;
  location?: string | null;
  salary?: string | null;
  is_remote?: boolean;
  job_type?: string | null;
  experience_level?: string | null;
  shopify_relevance_score?: number | null;
  ats_status?: string;
  apply_url?: string;
  company_logo_url?: string | null;
  is_active?: boolean;
  posted_at?: string | null;
  discovered_at?: string;
  created_at?: string;
  raw_payload?: {
    job_google_link?: string | null;
  } | null;
};

export type JobListApiResponse = {
  items: JobListApiItem[];
  total: number;
  limit: number;
  offset: number;
};

export type ListJobsParams = {
  page: number;
  page_size: number;
  sort: JobListSort;
  include_inactive: boolean;
  include_duplicates: boolean;
  q?: string;
};

function apiTitle(item: JobListApiItem): string {
  return (item.job_title ?? item.title ?? "").trim() || "Untitled role";
}

function apiDiscoveredAt(item: JobListApiItem): string {
  for (const field of [item.posted_at, item.discovered_at, item.created_at]) {
    const value = field?.trim();
    if (value) return value;
  }
  return new Date(0).toISOString();
}

function apiApplyUrl(item: JobListApiItem): string {
  const direct = item.apply_url?.trim();
  if (direct) return direct;
  const google = item.raw_payload?.job_google_link?.trim();
  if (google) return google;
  return "#";
}

function normalizeJobListItem(item: JobListApiItem): JobListItem {
  const score = item.shopify_relevance_score;
  return {
    id: item.id,
    title: apiTitle(item),
    company: item.company?.trim() || "—",
    location: item.location?.trim() || null,
    salary: item.salary?.trim() || null,
    is_remote: Boolean(item.is_remote),
    job_type: item.job_type?.trim() || null,
    experience_level: item.experience_level?.trim() || null,
    shopify_relevance_score: score == null ? null : Number(score),
    ats_status: normalizeAtsStatus(item.ats_status),
    apply_url: apiApplyUrl(item),
    company_logo_url: item.company_logo_url?.trim() || null,
    is_active: item.is_active ?? true,
    discovered_at: apiDiscoveredAt(item),
    created_at: item.created_at?.trim() || apiDiscoveredAt(item),
  };
}

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

/** Map API limit/offset payload into page-based UI state. */
export function normalizeJobListResponse(
  raw: JobListApiResponse,
  requestedPage: number,
  requestedPageSize: number,
): JobListResponse {
  const pageSize = positiveInt(raw.limit, requestedPageSize);
  const offset = nonNegativeInt(raw.offset, (requestedPage - 1) * pageSize);
  const total = nonNegativeInt(raw.total, 0);
  const page = pageSize > 0 ? Math.floor(offset / pageSize) + 1 : requestedPage;
  const items = Array.isArray(raw.items) ? raw.items.map(normalizeJobListItem) : [];

  return {
    items,
    total,
    page: Math.max(1, page),
    page_size: pageSize,
  };
}

export async function listJobs(
  token: string,
  params: ListJobsParams,
): Promise<JobListResponse> {
  const pageSize = positiveInt(params.page_size, 20);
  const page = positiveInt(params.page, 1);
  const offset = (page - 1) * pageSize;

  const search = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
    sort: params.sort,
    include_inactive: String(params.include_inactive),
    include_duplicates: String(params.include_duplicates),
  });
  const q = params.q?.trim();
  if (q) search.set("q", q);

  const raw = await fetchAuthedJson<JobListApiResponse>(token, `/api/v1/jobs?${search}`);
  return normalizeJobListResponse(raw, page, pageSize);
}
