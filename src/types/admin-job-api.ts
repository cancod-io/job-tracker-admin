/**
 * Mirrors OpenAPI schemas for the `admin-jobs` tag:
 *   GET    /api/admin/jobs                       — AdminJobListResponse
 *   GET    /api/admin/jobs/{job_id}/applicants   — AdminJobApplicantListResponse
 *   PATCH  /api/admin/jobs/{job_id}              — AdminJobUpdatePatch (not used in the list UI yet)
 *   DELETE /api/admin/jobs/{job_id}              — 204
 */

/** Application lifecycle status reported by the admin applicants endpoint. */
export type ApplicantStatus = "applied" | "interviewing" | "offer" | "failed" | "rejected";

/** Applicant row shown inline (preview) or in the expanded "applicants for this job" table. */
export type AdminJobApplicant = {
  application_id: number;
  user_id: number;
  full_name: string;
  email: string;
  status: string;
  applied_at: string | null;
  notes: string;
  created_at: string;
  /**
   * Existence signal for the applicant's avatar. Non-empty means an avatar can be
   * fetched (Bearer) from `GET /api/admin/users/{user_id}/avatar/download`.
   * Browsers cannot attach auth headers on `<img src>`, so we never load this URL
   * directly — see `useApplicantAvatar`.
   */
  profile_picture_url: string | null;
};

/** Full job row for admin tools (`AdminJobDetailResponse`). */
export type AdminJobDetail = {
  id: number;
  source: string;
  job_id: string | null;
  apply_url: string;
  job_title: string;
  company: string;
  company_logo_url: string | null;
  description: string;
  location: string | null;
  salary: string | null;
  job_type: string | null;
  skills: string[];
  normalized_title: string | null;
  is_new: boolean;
  posted_at: string | null;
  scraped_at: string | null;
  created_at: string;
  updated_at: string;
  applicants_total: number;
  applicants_preview: AdminJobApplicant[];
};

/** `AdminJobListResponse`. */
export type AdminJobListResponse = {
  items: AdminJobDetail[];
  total: number;
  page: number;
  page_size: number;
};

/** `AdminJobApplicantListResponse` — same envelope, applicant rows. */
export type AdminJobApplicantListResponse = {
  items: AdminJobApplicant[];
  total: number;
  page: number;
  page_size: number;
};
