/**
 * Types for the Job Scraper service API (`/api/jobs/...`).
 * Field names derived from live API responses at http://172.20.1.108:3000
 */

// ---------------------------------------------------------------------------
// GET /api/jobs/api_usage_monitor
// ---------------------------------------------------------------------------

/** SerpAPI account detail — present when `?live=true` is passed. */
export type SerpApiAccount = {
  account_id: string;
  account_email: string;
  account_status: string;         // e.g. "Active"
  plan_id: string;                // e.g. "free"
  plan_name: string;              // e.g. "Free Plan"
  plan_monthly_price: number;
  searches_per_month: number;     // monthly quota
  plan_searches_left: number;     // remaining quota for this month
  extra_credits: number;
  total_searches_left: number;
  this_month_usage: number;
  this_hour_searches: number;
  last_hour_searches: number;
  account_rate_limit_per_hour: number;
};

export type SerpApiInfo = {
  configured: boolean;
  /** Populated when `?live=true` */
  account?: SerpApiAccount;
  error?: string;
};

/** RapidAPI plan quota — present when `?live=true&rapidapi_probe=true` */
export type RapidApiPlan = {
  limit: number;
  remaining: number;
  resetSeconds: number;
  resetHuman: string;   // e.g. "398.8h"
};

export type RapidApiQuota = {
  available: boolean;
  plan: RapidApiPlan | null;
  rateWindow: unknown;
};

export type RapidApiInfo = {
  configured: boolean;
  probed: boolean;
  quota: RapidApiQuota | null;
  probeError: string | null;
  probeStatus?: number;
  probeCountry?: string;
  /** Present when probe not yet done */
  note?: string;
};

/** Full monitor response shape from GET /api/jobs/api_usage_monitor */
export type MonitorStatus = {
  checkedAt: string;        // ISO timestamp
  uptimeSeconds: number;
  busy: boolean;
  serpapi: SerpApiInfo;
  rapidapi: RapidApiInfo;
  live: boolean;
  note?: string;
};

// ---------------------------------------------------------------------------
// GET /api/jobs/help
// ---------------------------------------------------------------------------

export type AdminCommand = {
  command: string;        // e.g. "all"
  method: string;         // "GET" | "POST"
  path: string;           // e.g. "/api/jobs/all"
  description: string;
};

export type AdminHelpResponse = {
  message: string;
  commands: AdminCommand[];
  cliEquivalents: string[];
  note: string;
};

// ---------------------------------------------------------------------------
// GET /api/jobs/exit
// ---------------------------------------------------------------------------

export type ExitInfoResponse = {
  message: string;
  method: string;   // "POST"
  path: string;     // "/api/jobs/exit"
};

// ---------------------------------------------------------------------------
// POST ingest routes (/api/jobs/all | jsearch | serpapi)
// ---------------------------------------------------------------------------

export type DatePostedFilter = "all" | "today" | "3days" | "week" | "month";

export type IngestParams = {
  /** Search keywords — overrides QUERY in .env */
  query?: string;
  /** Comma-separated ISO country codes — overrides COUNTRIES in .env */
  countries?: string;
  /** Alias for a single country */
  country?: string;
  /** Pages per country (1–20) */
  num_pages?: number;
  /** Starting page number */
  page?: number;
  /** Posting recency filter */
  date_posted?: DatePostedFilter;
  /** SerpAPI country code (serpapi routes only) */
  gl?: string;
};

export type IngestProvider = "all" | "jsearch" | "serpapi";

export type IngestResult = {
  status?: string;
  message?: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  [key: string]: unknown;
};
