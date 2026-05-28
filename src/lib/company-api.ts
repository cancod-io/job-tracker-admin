/**
 * Browser-side client for the Companies admin API.
 *
 * Endpoints (per the Companies Management diagram, namespaced under the
 * existing `/api/v1/admin` admin surface — same pattern as `admin/users`):
 *   GET    /api/v1/admin/companies         — list (paginated, searchable)
 *   POST   /api/v1/admin/companies         — create
 *   GET    /api/v1/admin/companies/{id}    — detail
 *   PUT    /api/v1/admin/companies/{id}    — update
 *   DELETE /api/v1/admin/companies/{id}    — delete
 *   GET    /api/v1/admin/companies/export  — CSV download
 *   POST   /api/v1/admin/companies/import  — multipart/form-data CSV upload
 */
import { fetchAuthedJson, fetchAuthedResponse } from "@/lib/fetch-authed";
import type {
  Company,
  CompanyImportSummary,
  CompanyListResponse,
  CompanyStatusFilter,
  CompanyWritePayload,
} from "@/types/company-api";

const BASE = "/api/v1/admin/companies";

export type ListCompaniesParams = {
  page: number;
  page_size: number;
  search?: string;
  status?: CompanyStatusFilter;
};

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
  return fetchAuthedJson<CompanyListResponse>(token, `${BASE}?${q}`);
}

export function createCompany(
  token: string,
  payload: CompanyWritePayload,
): Promise<Company> {
  return fetchAuthedJson<Company>(token, BASE, {
    method: "POST",
    body: payload,
  });
}

export function updateCompany(
  token: string,
  id: number,
  payload: CompanyWritePayload,
): Promise<Company> {
  return fetchAuthedJson<Company>(token, `${BASE}/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteCompany(token: string, id: number): Promise<void> {
  await fetchAuthedJson<void>(token, `${BASE}/${id}`, { method: "DELETE" });
}

/** Trigger a CSV download of all companies via a blob URL. */
export async function exportCompaniesCsv(
  token: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetchAuthedResponse(token, `${BASE}/export`, { timeoutMs: 60_000 });

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition);
  const filename = match?.[1] ?? `companies-${new Date().toISOString().slice(0, 10)}.csv`;

  return { blob: await res.blob(), filename };
}

/** Upload a CSV file (multipart/form-data) and return the import summary. */
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
