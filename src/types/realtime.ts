export type RealtimeEventType =
  | "jobs.ingested"
  | "scraper_run.updated"
  | "analytics.invalidate"
  | "user.updated";

export type RealtimeEvent = {
  id: string;
  type: RealtimeEventType;
  ts: string;
  payload: Record<string, unknown>;
};

export type JobsIngestedPayload = {
  run_id: string | null;
  scraper_name: string;
  added: number;
  updated: number;
  unchanged: number;
  removed: number;
  failed: number;
  blocked: number;
  duration_ms: number;
  sources: Array<{
    source: string;
    fetch_run_id: number;
    external_run_id: string | null;
    added: number;
    updated: number;
    unchanged: number;
    removed: number;
  }>;
};

export type ScraperRunUpdatedPayload = {
  run_id: string;
  provider: string;
  status: string;
  added_count: number;
  updated_count: number;
  unchanged_count: number;
  removed_count: number;
  fetch_run_id: number | null;
  error_message: string | null;
};

export type AnalyticsInvalidatePayload = {
  reason: "jobs.ingested" | "scraper_run.updated" | string;
};

export type UserUpdatedPayload = {
  user_id: number;
  approval_status?: string;
  full_name?: string;
  email?: string;
};
