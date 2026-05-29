/**
 * Browser-side client for the Career URLs admin API.
 *
 * Endpoints (OpenAPI `admin-career-urls` tag):
 *   GET    /api/admin/career-urls                    — list (page, page_size, q)
 *   POST   /api/admin/career-urls                    — create
 *   GET    /api/admin/career-urls/{career_url_id}    — detail
 *   PATCH  /api/admin/career-urls/{career_url_id}    — update
 *   DELETE /api/admin/career-urls/{career_url_id}    — delete (204)
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import type {
  CareerUrl,
  CareerUrlCreateRequest,
  CareerUrlListResponse,
  CareerUrlUpdatePatch,
} from "@/types/career-url-api";

const BASE = "/api/admin/career-urls";

export type ListCareerUrlsParams = {
  page: number;
  page_size: number;
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

function normalizeCareerUrl(raw: Partial<CareerUrl> & { id: number }): CareerUrl {
  return {
    id: raw.id,
    career_url: typeof raw.career_url === "string" ? raw.career_url : "—",
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

type RawCareerUrlListResponse = {
  items?: unknown;
  total?: unknown;
  page?: unknown;
  page_size?: unknown;
};

function isRawCareerUrl(value: unknown): value is Partial<CareerUrl> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

function normalizeCareerUrlListResponse(
  raw: RawCareerUrlListResponse,
  requestedPage: number,
  requestedPageSize: number,
): CareerUrlListResponse {
  const pageSize = positiveInt(raw.page_size, requestedPageSize);
  const page = positiveInt(raw.page, requestedPage);
  const total = nonNegativeInt(raw.total, 0);
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).filter(isRawCareerUrl).map(normalizeCareerUrl)
    : [];

  return { items, total, page, page_size: pageSize };
}

export async function listCareerUrls(
  token: string,
  params: ListCareerUrlsParams,
): Promise<CareerUrlListResponse> {
  const q = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
  });
  const search = params.q?.trim();
  if (search) q.set("q", search);

  const raw = await fetchAuthedJson<RawCareerUrlListResponse>(token, `${BASE}?${q}`);
  return normalizeCareerUrlListResponse(raw, params.page, params.page_size);
}

export function getCareerUrl(token: string, careerUrlId: number): Promise<CareerUrl> {
  return fetchAuthedJson<CareerUrl>(token, `${BASE}/${careerUrlId}`);
}

export function createCareerUrl(
  token: string,
  payload: CareerUrlCreateRequest,
): Promise<CareerUrl> {
  return fetchAuthedJson<CareerUrl>(token, BASE, {
    method: "POST",
    body: payload,
  });
}

export function updateCareerUrl(
  token: string,
  careerUrlId: number,
  payload: CareerUrlUpdatePatch,
): Promise<CareerUrl> {
  return fetchAuthedJson<CareerUrl>(token, `${BASE}/${careerUrlId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteCareerUrl(token: string, careerUrlId: number): Promise<void> {
  await fetchAuthedJson<void>(token, `${BASE}/${careerUrlId}`, { method: "DELETE" });
}
