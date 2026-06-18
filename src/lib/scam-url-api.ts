/**
 * Browser-side client for the Block Lists admin API.
 *
 * Endpoints:
 *   GET    /api/admin/scam-urls              — list (page, page_size, q)
 *   POST   /api/admin/scam-urls              — create
 *   GET    /api/admin/scam-urls/{id}         — detail
 *   PATCH  /api/admin/scam-urls/{id}         — update
 *   DELETE /api/admin/scam-urls/{id}         — delete (204)
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import type {
  ScamUrl,
  ScamUrlCreateRequest,
  ScamUrlCreateResponse,
  ScamUrlListResponse,
  ScamUrlType,
  ScamUrlUpdatePatch,
} from "@/types/scam-url-api";

const BASE = "/api/admin/scam-urls";

export type ListScamUrlsParams = {
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

function normalizeUrlType(value: unknown): ScamUrlType {
  return value === "url" ? "url" : "domain";
}

function normalizeScamUrl(raw: Partial<ScamUrl> & { id: number }): ScamUrl {
  return {
    id: raw.id,
    url: typeof raw.url === "string" ? raw.url : "—",
    url_type: normalizeUrlType(raw.url_type),
    reason: typeof raw.reason === "string" ? raw.reason : "—",
    notes: typeof raw.notes === "string" ? raw.notes : null,
    reported_by_id: typeof raw.reported_by_id === "number" ? raw.reported_by_id : 0,
    reported_by_name: typeof raw.reported_by_name === "string" ? raw.reported_by_name : "—",
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

type RawScamUrlListResponse = {
  items?: unknown;
  total?: unknown;
  page?: unknown;
  page_size?: unknown;
};

function isRawScamUrl(value: unknown): value is Partial<ScamUrl> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

function normalizeScamUrlListResponse(
  raw: RawScamUrlListResponse,
  requestedPage: number,
  requestedPageSize: number,
): ScamUrlListResponse {
  const pageSize = positiveInt(raw.page_size, requestedPageSize);
  const page = positiveInt(raw.page, requestedPage);
  const total = nonNegativeInt(raw.total, 0);
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).filter(isRawScamUrl).map(normalizeScamUrl)
    : [];

  return { items, total, page, page_size: pageSize };
}

export async function listScamUrls(
  token: string,
  params: ListScamUrlsParams,
): Promise<ScamUrlListResponse> {
  const q = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
  });
  const search = params.q?.trim();
  if (search) q.set("q", search);

  const raw = await fetchAuthedJson<RawScamUrlListResponse>(token, `${BASE}?${q}`);
  return normalizeScamUrlListResponse(raw, params.page, params.page_size);
}

export async function getScamUrl(token: string, scamUrlId: number): Promise<ScamUrl> {
  const raw = await fetchAuthedJson<Partial<ScamUrl> & { id: number }>(
    token,
    `${BASE}/${scamUrlId}`,
  );
  return normalizeScamUrl(raw);
}

export async function createScamUrl(
  token: string,
  payload: ScamUrlCreateRequest,
): Promise<ScamUrlCreateResponse> {
  const raw = await fetchAuthedJson<{
    scam_url?: Partial<ScamUrl> & { id: number };
    removed_jobs?: unknown;
  }>(token, BASE, {
    method: "POST",
    body: payload,
  });

  const scamUrl = raw.scam_url;
  if (!scamUrl || typeof scamUrl.id !== "number") {
    throw new Error("Unexpected response from create Block List.");
  }

  return {
    scam_url: normalizeScamUrl(scamUrl),
    removed_jobs: nonNegativeInt(raw.removed_jobs, 0),
  };
}

export async function updateScamUrl(
  token: string,
  scamUrlId: number,
  payload: ScamUrlUpdatePatch,
): Promise<ScamUrl> {
  const raw = await fetchAuthedJson<Partial<ScamUrl> & { id: number }>(
    token,
    `${BASE}/${scamUrlId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  return normalizeScamUrl(raw);
}

export async function deleteScamUrl(token: string, scamUrlId: number): Promise<void> {
  await fetchAuthedJson<void>(token, `${BASE}/${scamUrlId}`, { method: "DELETE" });
}
