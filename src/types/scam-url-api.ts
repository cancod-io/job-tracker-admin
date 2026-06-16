/** Mirrors OpenAPI schemas for `/api/admin/scam-urls`. */

export type ScamUrlType = "domain" | "url";

export type ScamUrl = {
  id: number;
  url: string;
  url_type: ScamUrlType;
  reason: string;
  notes: string | null;
  reported_by_id: number;
  reported_by_name: string;
  created_at: string;
  updated_at: string;
};

export type ScamUrlListResponse = {
  items: ScamUrl[];
  total: number;
  page: number;
  page_size: number;
};

/** Payload for `POST /api/admin/scam-urls`. */
export type ScamUrlCreateRequest = {
  url: string;
  url_type: ScamUrlType;
  reason: string;
  notes?: string | null;
};

/** Payload for `PATCH /api/admin/scam-urls/{id}`. */
export type ScamUrlUpdatePatch = {
  url?: string;
  url_type?: ScamUrlType;
  reason?: string;
  notes?: string | null;
};

export type ScamUrlCreateResponse = {
  scam_url: ScamUrl;
  removed_jobs: number;
};
