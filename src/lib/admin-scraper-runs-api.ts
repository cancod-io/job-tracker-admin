import { apiUrl } from "@/lib/api";
import { API_PATHS } from "@/lib/api-paths";
import { readApiError, type ApiErrorBody } from "@/lib/fetch-authed";
import { ensureAccessToken, refreshAccessToken } from "@/lib/auth-session";
import {
  clearStoredTokens,
  getStoredAccessToken,
  isAccessTokenExpired,
  signalSessionExpired,
} from "@/lib/auth-token";
import { fetchWithTimeout } from "@/lib/http";
import type {
  ScraperRunListResponse,
  ScraperRunStartRequest,
  ScraperRunStartResponse,
  ScraperRunStopResponse,
  ScraperRunSummary,
  ScraperRunsListParams,
} from "@/types/scraper-runs-api";

const BASE = API_PATHS.adminScraperRuns.base;

/** Raised when POST /api/admin/scraper/runs returns HTTP 409 (another run is active). */
export class ScraperRunConflictError extends Error {
  readonly isConflict = true as const;
  readonly status = 409 as const;
  readonly activeRun: ScraperRunSummary | null;

  constructor(message: string, activeRun: ScraperRunSummary | null = null) {
    super(message);
    this.name = "ScraperRunConflictError";
    this.activeRun = activeRun;
  }
}

function dispatchSessionExpired(): void {
  clearStoredTokens();
  signalSessionExpired();
}

async function resolveAccessToken(passedToken: string): Promise<string | null> {
  const stored = getStoredAccessToken();
  const token = passedToken?.trim() || stored;
  if (!token) return null;
  if (!isAccessTokenExpired()) return token;
  return ensureAccessToken();
}

function buildListQuery(params: ScraperRunsListParams = {}): string {
  const search = new URLSearchParams();
  if (params.provider) search.set("provider", params.provider);
  if (params.status) search.set("status", params.status);
  if (params.limit != null) search.set("limit", String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function normalizeCounter(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeRun(raw: Partial<ScraperRunSummary> & { run_id: string }): ScraperRunSummary {
  return {
    run_id: raw.run_id,
    provider: typeof raw.provider === "string" ? raw.provider : "",
    status: typeof raw.status === "string" ? raw.status : "failed",
    started_at: typeof raw.started_at === "string" ? raw.started_at : new Date(0).toISOString(),
    finished_at: typeof raw.finished_at === "string" ? raw.finished_at : null,
    duration_ms:
      typeof raw.duration_ms === "number" && Number.isFinite(raw.duration_ms)
        ? raw.duration_ms
        : null,
    added_count: normalizeCounter(raw.added_count),
    updated_count: normalizeCounter(raw.updated_count),
    unchanged_count: normalizeCounter(raw.unchanged_count),
    removed_count: normalizeCounter(raw.removed_count),
    fetch_run_id:
      typeof raw.fetch_run_id === "number" && Number.isFinite(raw.fetch_run_id)
        ? raw.fetch_run_id
        : null,
    error_message: typeof raw.error_message === "string" ? raw.error_message : null,
    triggered_by_id:
      typeof raw.triggered_by_id === "number" && Number.isFinite(raw.triggered_by_id)
        ? raw.triggered_by_id
        : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

function isRawRun(value: unknown): value is Partial<ScraperRunSummary> & { run_id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { run_id?: unknown }).run_id === "string"
  );
}

function normalizeListResponse(raw: Partial<ScraperRunListResponse>): ScraperRunListResponse {
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).filter(isRawRun).map(normalizeRun)
    : [];
  return {
    items,
    total: typeof raw.total === "number" ? raw.total : items.length,
    limit: typeof raw.limit === "number" ? raw.limit : items.length,
  };
}

function parseConflictActiveRun(body: ApiErrorBody & Record<string, unknown>): ScraperRunSummary | null {
  const candidates = [
    body.active_run,
    body.run,
    (body.error as Record<string, unknown> | undefined)?.active_run,
    (body.detail as Record<string, unknown> | undefined)?.active_run,
  ];
  for (const candidate of candidates) {
    if (isRawRun(candidate)) return normalizeRun(candidate);
  }
  return null;
}

async function scraperFetch(
  token: string,
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  let accessToken = await resolveAccessToken(token);
  if (!accessToken) {
    dispatchSessionExpired();
    throw new Error("Your session has expired. Please sign in again.");
  }

  const { timeoutMs, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  let res = await fetchWithTimeout(apiUrl(path), { ...rest, headers, credentials: "omit" }, timeoutMs);

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      accessToken = refreshed;
      headers.set("Authorization", `Bearer ${accessToken}`);
      res = await fetchWithTimeout(
        apiUrl(path),
        { ...rest, headers, credentials: "omit" },
        timeoutMs,
      );
    }
  }

  if (res.status === 401) {
    dispatchSessionExpired();
    throw new Error(await readApiError(res, "Your session has expired. Please sign in again."));
  }

  return res;
}

export async function listScraperRuns(
  token: string,
  params: ScraperRunsListParams = {},
): Promise<ScraperRunListResponse> {
  const res = await scraperFetch(token, `${BASE}${buildListQuery(params)}`);
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to load scraper runs."));
  }
  return normalizeListResponse((await res.json()) as Partial<ScraperRunListResponse>);
}

export async function startScraperRun(
  token: string,
  body: ScraperRunStartRequest,
): Promise<ScraperRunStartResponse> {
  const res = await scraperFetch(token, BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: 30_000,
  });

  if (res.status === 409) {
    const errorBody = (await res.json().catch(() => ({}))) as ApiErrorBody & Record<string, unknown>;
    const activeRun = parseConflictActiveRun(errorBody);
    const message =
      errorBody.error?.message ??
      errorBody.message ??
      (typeof errorBody.detail === "string" ? errorBody.detail : null) ??
      "Another scraper run is already in progress.";
    throw new ScraperRunConflictError(message, activeRun);
  }

  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to start scraper run."));
  }

  return (await res.json()) as ScraperRunStartResponse;
}

export async function stopScraperRun(
  token: string,
  runId: string,
): Promise<ScraperRunStopResponse> {
  const res = await scraperFetch(token, API_PATHS.adminScraperRuns.stop(runId), {
    method: "POST",
    timeoutMs: 30_000,
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to stop scraper run."));
  }
  return (await res.json()) as ScraperRunStopResponse;
}

export async function getScraperRun(token: string, runId: string): Promise<ScraperRunSummary> {
  const res = await scraperFetch(token, API_PATHS.adminScraperRuns.detail(runId));
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to load scraper run."));
  }
  const body = (await res.json()) as Partial<ScraperRunSummary> & { run_id: string };
  return normalizeRun(body);
}
