/**
 * Client for the Job Scraper service (`/api/jobs/...`).
 *
 * Browser: `/upstream-scraper/...` is proxied by Next.js rewrites to
 *   `${SCRAPER_INTERNAL_URL}/api/jobs/...`  (avoids CORS preflight).
 *
 * Server (SSR): calls `SCRAPER_INTERNAL_URL` or `NEXT_PUBLIC_SCRAPER_API_URL` directly.
 */
import { fetchWithTimeout } from "@/lib/http";
import type {
  AdminHelpResponse,
  ExitInfoResponse,
  IngestParams,
  IngestResult,
  MonitorStatus,
} from "@/types/scraper-api";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Raised on HTTP 409 — another ingest is already running. */
export class ConflictError extends Error {
  readonly isConflict = true as const;
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function getScraperOrigin(): string {
  const raw =
    process.env.SCRAPER_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_SCRAPER_API_URL ??
    "http://172.20.1.108:3000";
  return raw.replace(/\/$/, "");
}

/**
 * Resolve `/api/jobs/<rest>` to the correct fetch URL:
 * - Browser  → `/upstream-scraper/<rest>`  (proxied by Next.js rewrite)
 * - Node/SSR → `${scraperOrigin}/api/jobs/<rest>`
 */
function scraperUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  // Strip the `/api/jobs` prefix to build the browser proxy path
  const afterJobs = normalized.startsWith("/api/jobs")
    ? normalized.slice("/api/jobs".length)
    : normalized;

  if (typeof window !== "undefined") {
    return `/upstream-scraper${afterJobs}`;
  }
  return `${getScraperOrigin()}${normalized}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * GET /api/jobs/help
 * Returns: { message, commands: [{command, method, path, description}], cliEquivalents, note }
 */
export async function getAdminHelp(): Promise<AdminHelpResponse> {
  const res = await fetchWithTimeout(scraperUrl("/api/jobs/help"), {}, 10_000);
  if (!res.ok) throw new Error(`Help request failed (${res.status})`);
  return res.json() as Promise<AdminHelpResponse>;
}

/**
 * GET /api/jobs/api_usage_monitor
 *
 * Options:
 *  - `live: true`              → fetches live SerpAPI account quota
 *  - `rapidapi_probe: true`    → additionally probes JSearch (uses 1 RapidAPI credit)
 *
 * Returns: MonitorStatus with `serpapi.configured`, `rapidapi.configured`,
 *          `uptimeSeconds`, `busy`, `checkedAt`, etc.
 */
export async function getMonitorStatus(
  options: { live?: boolean; rapidapi_probe?: boolean } = {},
): Promise<MonitorStatus> {
  const params = new URLSearchParams();
  if (options.live) params.set("live", "true");
  if (options.rapidapi_probe) params.set("rapidapi_probe", "true");
  const qs = params.toString();
  const url = scraperUrl(`/api/jobs/api_usage_monitor${qs ? `?${qs}` : ""}`);
  const timeout = options.live ? 30_000 : 10_000;
  const res = await fetchWithTimeout(url, {}, timeout);
  if (!res.ok) throw new Error(`Monitor request failed (${res.status})`);
  return res.json() as Promise<MonitorStatus>;
}

/**
 * GET /api/jobs/exit
 * Returns usage info only — does NOT stop the server.
 * Response: { message, method: "POST", path: "/api/jobs/exit" }
 */
export async function getExitInfo(): Promise<ExitInfoResponse> {
  const res = await fetchWithTimeout(scraperUrl("/api/jobs/exit"), {}, 10_000);
  if (!res.ok) throw new Error(`Exit-info request failed (${res.status})`);
  return res.json() as Promise<ExitInfoResponse>;
}

/** POST /api/jobs/all — run JSearch + SerpAPI together. */
export async function runAllProviders(params: IngestParams = {}): Promise<IngestResult> {
  return postIngest(scraperUrl("/api/jobs/all"), params);
}

/** POST /api/jobs/jsearch — JSearch (RapidAPI) only. */
export async function runJSearch(params: IngestParams = {}): Promise<IngestResult> {
  return postIngest(scraperUrl("/api/jobs/jsearch"), params);
}

/** POST /api/jobs/serpapi — SerpAPI (Google Jobs) only. */
export async function runSerpApi(params: IngestParams = {}): Promise<IngestResult> {
  return postIngest(scraperUrl("/api/jobs/serpapi"), params);
}

/**
 * POST /api/jobs/exit — graceful shutdown.
 * Closes the HTTP server + Postgres pool, then exits the Node.js process.
 * A network error is expected if the process exits before responding — treated as success.
 */
export async function gracefulShutdown(): Promise<{ message: string }> {
  try {
    const res = await fetchWithTimeout(scraperUrl("/api/jobs/exit"), { method: "POST" }, 8_000);
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { message: body.message ?? "Shutdown signal sent." };
  } catch {
    return { message: "Server appears to have shut down (connection closed)." };
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function postIngest(url: string, params: IngestParams): Promise<IngestResult> {
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    300_000, // 5-minute timeout for multi-page / multi-country ingests
  );

  if (res.status === 409) {
    throw new ConflictError("Another ingest is already running. Please wait and try again.");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(body.message ?? body.error ?? `Ingest failed (HTTP ${res.status})`);
  }
  return res.json() as Promise<IngestResult>;
}
