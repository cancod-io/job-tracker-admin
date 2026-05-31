/** Mirrors OpenAPI schemas for `/api/admin/career-urls`. */

export type CareerUrl = {
  id: number;
  career_url: string;
  created_at: string;
  updated_at: string;
};

export type CareerUrlListResponse = {
  items: CareerUrl[];
  total: number;
  page: number;
  page_size: number;
};

/** Payload for `POST /api/admin/career-urls`. */
export type CareerUrlCreateRequest = {
  career_url: string;
};

/** Payload for `PATCH /api/admin/career-urls/{career_url_id}`. */
export type CareerUrlUpdatePatch = {
  career_url?: string | null;
};
