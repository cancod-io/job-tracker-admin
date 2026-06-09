/**
 * Browser-side client for the admin Jobs API.
 *
 * Endpoints (OpenAPI `admin-jobs` tag):
 *   GET    /api/admin/jobs                     — list (page, page_size, q, source, job_title, company, location, ...)
 *   GET    /api/admin/jobs/{job_id}/applicants — list applicants for a job
 *   DELETE /api/admin/jobs/{job_id}            — delete (204)
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import type {
  AdminJobApplicant,
  AdminJobApplicantListResponse,
  AdminJobDetail,
  AdminJobListResponse,
} from "@/types/admin-job-api";

const BASE = "/api/admin/jobs";

export type AdminJobSortBy = "posted_at" | "created_at" | "id";
export type SortOrder = "asc" | "desc";

export type ListAdminJobsParams = {
  page: number;
  page_size: number;
  q?: string;
  sort_by?: AdminJobSortBy;
  sort_order?: SortOrder;
};

export type ListJobApplicantsParams = {
  page?: number;
  page_size?: number;
  status?: string;
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

function normalizeApplicant(raw: Partial<AdminJobApplicant>): AdminJobApplicant {
  return {
    application_id: nonNegativeInt(raw.application_id, 0),
    user_id: nonNegativeInt(raw.user_id, 0),
    full_name: str(raw.full_name, "—"),
    email: str(raw.email),
    status: str(raw.status, "applied"),
    applied_at: typeof raw.applied_at === "string" ? raw.applied_at : null,
    notes: str(raw.notes),
    created_at: str(raw.created_at, new Date(0).toISOString()),
    profile_picture_url: strOrNull(
      raw.profile_picture_url ?? (raw as { avatar_url?: unknown }).avatar_url,
    ),
  };
}

function normalizeJob(raw: Partial<AdminJobDetail> & { id: number }): AdminJobDetail {
  return {
    id: raw.id,
    source: str(raw.source),
    job_id: strOrNull(raw.job_id),
    apply_url: str(raw.apply_url, "#"),
    job_title: str(raw.job_title, "Untitled role"),
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
    created_at: str(raw.created_at, new Date(0).toISOString()),
    updated_at: str(raw.updated_at, new Date(0).toISOString()),
    applicants_total: nonNegativeInt(raw.applicants_total, 0),
    applicants_preview: Array.isArray(raw.applicants_preview)
      ? raw.applicants_preview.map((a) => normalizeApplicant(a as Partial<AdminJobApplicant>))
      : [],
  };
}

function isRawJob(value: unknown): value is Partial<AdminJobDetail> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

export async function listAdminJobs(
  token: string,
  params: ListAdminJobsParams,
): Promise<AdminJobListResponse> {
  const search = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
  });
  const q = params.q?.trim();
  if (q) search.set("q", q);
  if (params.sort_by) search.set("sort_by", params.sort_by);
  if (params.sort_order) search.set("sort_order", params.sort_order);

  const raw = await fetchAuthedJson<{
    items?: unknown;
    total?: unknown;
    page?: unknown;
    page_size?: unknown;
  }>(token, `${BASE}?${search}`);

  return {
    items: Array.isArray(raw.items)
      ? (raw.items as unknown[]).filter(isRawJob).map(normalizeJob)
      : [],
    total: nonNegativeInt(raw.total, 0),
    page: positiveInt(raw.page, params.page),
    page_size: positiveInt(raw.page_size, params.page_size),
  };
}

export async function listJobApplicants(
  token: string,
  jobId: number,
  params: ListJobApplicantsParams = {},
): Promise<AdminJobApplicantListResponse> {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.page_size ?? 25),
  });
  if (params.status) search.set("status", params.status);
  const q = params.q?.trim();
  if (q) search.set("q", q);

  const raw = await fetchAuthedJson<{
    items?: unknown;
    total?: unknown;
    page?: unknown;
    page_size?: unknown;
  }>(token, `${BASE}/${jobId}/applicants?${search}`);

  return {
    items: Array.isArray(raw.items)
      ? (raw.items as unknown[]).map((a) => normalizeApplicant(a as Partial<AdminJobApplicant>))
      : [],
    total: nonNegativeInt(raw.total, 0),
    page: positiveInt(raw.page, params.page ?? 1),
    page_size: positiveInt(raw.page_size, params.page_size ?? 25),
  };
}

export async function deleteAdminJob(token: string, jobId: number): Promise<void> {
  await fetchAuthedJson<void>(token, `${BASE}/${jobId}`, { method: "DELETE" });
}
