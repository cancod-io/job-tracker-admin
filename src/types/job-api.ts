/** Mirrors `JobAtsStatus` / `JobListItem` / `JobListResponse` from the API OpenAPI schema. */

export type JobAtsStatus =
  | "new"
  | "shortlisted"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "archived";

export type JobListSort = "relevance" | "newest";

export type JobListItem = {
  id: number;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  is_remote: boolean;
  job_type: string | null;
  experience_level: string | null;
  shopify_relevance_score: number | null;
  ats_status: JobAtsStatus;
  apply_url: string;
  company_logo_url: string | null;
  is_active: boolean;
  discovered_at: string;
  created_at: string;
};

/** Normalized list payload for admin UI (derived from API `limit` / `offset`). */
export type JobListResponse = {
  items: JobListItem[];
  total: number;
  page: number;
  page_size: number;
};
