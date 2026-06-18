/** `change_type` on fetch-run diff rows and job list filters. */
export const API_FETCH_CHANGE_TYPES = [
  "added",
  "updated",
  "unchanged",
  "removed",
] as const;

export type ApiFetchChangeType = (typeof API_FETCH_CHANGE_TYPES)[number];

export function fetchChangeLabel(change: ApiFetchChangeType): string {
  switch (change) {
    case "added":
      return "Added";
    case "updated":
      return "Updated";
    case "unchanged":
      return "Unchanged";
    case "removed":
      return "Removed";
  }
}

/** Summary row from `GET /api/v1/jobs/fetch-runs`. */
export type ApiFetchRun = {
  id: number;
  source: string;
  external_run_id?: string | null;
  scraper_name?: string | null;
  started_at: string;
  previous_run_id: number | null;
  total_jobs: number;
  added_count: number;
  updated_count: number;
  unchanged_count: number;
  removed_count: number;
  created_at?: string;
};

export type ApiFetchRunsListResponse = {
  items: ApiFetchRun[];
  total: number;
  page: number;
  page_size: number;
};

export type FetchRunsListParams = {
  source?: string;
  page?: number;
  page_size?: number;
};
