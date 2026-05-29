/**
 * Browser-side client for the Companies admin API.
 *
 * Endpoints (OpenAPI `admin-companies` tag):
 *   GET    /api/admin/companies              — list (page, page_size, q, is_active)
 *   POST   /api/admin/companies              — create
 *   GET    /api/admin/companies/{company_id} — detail
 *   PATCH  /api/admin/companies/{company_id} — update
 *   DELETE /api/admin/companies/{company_id} — delete (204)
 *   GET    /api/admin/companies/export       — CSV download
 *   POST   /api/admin/companies/import       — multipart/form-data CSV upload
 */
import { fetchAuthedJson, fetchAuthedResponse } from "@/lib/fetch-authed";
import type {
  Company,
  CompanyCreateRequest,
  CompanyImportSummary,
  CompanyListResponse,
  CompanyStatusFilter,
  CompanyUpdatePatch,
} from "@/types/company-api";

const BASE = "/api/admin/companies";

export type ListCompaniesParams = {
  page: number;
  page_size: number;
  search?: string;
  status?: CompanyStatusFilter;
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

function normalizeCompany(raw: Partial<Company> & { id: number }): Company {
  return {
    id: raw.id,
    name: typeof raw.name === "string" ? raw.name : "—",
    website_url: typeof raw.website_url === "string" ? raw.website_url : null,
    career_page_url_id:
      typeof raw.career_page_url_id === "number" ? raw.career_page_url_id : null,
    career_page_url: typeof raw.career_page_url === "string" ? raw.career_page_url : null,
    scraping_method_id:
      typeof raw.scraping_method_id === "number" ? raw.scraping_method_id : null,
    scraping_method: typeof raw.scraping_method === "string" ? raw.scraping_method : null,
    api_endpoint: typeof raw.api_endpoint === "string" ? raw.api_endpoint : null,
    is_active: raw.is_active ?? true,
    last_scraped_at: typeof raw.last_scraped_at === "string" ? raw.last_scraped_at : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

function normalizeCompanyListResponse(
  raw: Partial<CompanyListResponse>,
  requestedPage: number,
  requestedPageSize: number,
): CompanyListResponse {
  const pageSize = positiveInt(raw.page_size, requestedPageSize);
  const page = positiveInt(raw.page, requestedPage);
  const total = nonNegativeInt(raw.total, 0);
  const items = Array.isArray(raw.items)
    ? raw.items
        .filter((item): item is Partial<Company> & { id: number } => typeof item?.id === "number")
        .map(normalizeCompany)
    : [];

  return { items, total, page, page_size: pageSize };
}

export async function listCompanies(
  token: string,
  params: ListCompaniesParams,
): Promise<CompanyListResponse> {
  const q = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
  });
  const search = params.search?.trim();
  if (search) q.set("q", search);
  if (params.status && params.status !== "all") {
    q.set("is_active", params.status === "active" ? "true" : "false");
  }
  const raw = await fetchAuthedJson<Partial<CompanyListResponse>>(token, `${BASE}?${q}`);
  return normalizeCompanyListResponse(raw, params.page, params.page_size);
}

export function getCompany(token: string, companyId: number): Promise<Company> {
  return fetchAuthedJson<Company>(token, `${BASE}/${companyId}`);
}

export function createCompany(
  token: string,
  payload: CompanyCreateRequest,
): Promise<Company> {
  return fetchAuthedJson<Company>(token, BASE, {
    method: "POST",
    body: payload,
  });
}

export function updateCompany(
  token: string,
  id: number,
  payload: CompanyUpdatePatch,
): Promise<Company> {
  return fetchAuthedJson<Company>(token, `${BASE}/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteCompany(token: string, id: number): Promise<void> {
  await fetchAuthedJson<void>(token, `${BASE}/${id}`, { method: "DELETE" });
}

/** Download the full companies catalogue as CSV. */
export async function exportCompaniesCsv(
  token: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetchAuthedResponse(token, `${BASE}/export`, { timeoutMs: 60_000 });

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition);
  const filename = match?.[1] ?? `companies-${new Date().toISOString().slice(0, 10)}.csv`;

  return { blob: await res.blob(), filename };
}

/** Upsert companies from a UTF-8 CSV upload (`file` field). */
export function importCompaniesCsv(
  token: string,
  file: File,
): Promise<CompanyImportSummary> {
  const form = new FormData();
  form.append("file", file, file.name);

  return fetchAuthedJson<CompanyImportSummary>(token, `${BASE}/import`, {
    method: "POST",
    body: form,
    timeoutMs: 300_000,
  });
}
