/** Known provider slugs sent to POST /api/admin/scraper/runs (extensible via API config sources). */
export const SCRAPER_RUN_PROVIDERS = [
  "serpapi",
  "fantastic",
  "fantastic_jb",
  "theirstack",
  "all",
] as const;
export type ScraperRunProvider = (typeof SCRAPER_RUN_PROVIDERS)[number] | string;

/** Run lifecycle status from the scraper runs API. */
export const SCRAPER_RUN_STATUSES = [
  "queued",
  "running",
  "success",
  "failed",
  "cancelled",
] as const;
export type ScraperRunStatus = (typeof SCRAPER_RUN_STATUSES)[number];

export type ScraperRunSummary = {
  run_id: string;
  provider: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  added_count: number;
  /** Mapped rows before filters — optional from scraper. */
  received_count?: number;
  blocked_count?: number;
  /** @deprecated always 0 — added-only model */
  updated_count?: number;
  /** @deprecated always 0 — added-only model */
  unchanged_count?: number;
  /** @deprecated always 0 — added-only model */
  removed_count?: number;
  fetch_run_id: number | null;
  error_message: string | null;
  triggered_by_id: number | null;
  created_at: string;
  updated_at: string;
};

export type ScraperRunListResponse = {
  items: ScraperRunSummary[];
  total: number;
  limit: number;
};

export type ScraperRunStartRequest = {
  provider: string;
  overrides?: Record<string, unknown>;
};

export type ScraperRunStartResponse = {
  run_id: string;
  status: ScraperRunStatus;
  provider: ScraperRunProvider;
};

export type ScraperRunStopResponse = {
  run_id: string;
  status: "cancelled";
};

export type ScraperRunsListParams = {
  provider?: string;
  status?: string;
  limit?: number;
  offset?: number;
};
