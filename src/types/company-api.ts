/**
 * Mirrors OpenAPI schemas for `/api/admin/companies`.
 */

/** Detailed company response with resolved FK names/URLs. */
export type Company = {
  id: number;
  name: string;
  website_url: string | null;
  career_page_url_id: number | null;
  career_page_url: string | null;
  scraping_method_id: number | null;
  scraping_method: string | null;
  api_endpoint: string | null;
  is_active: boolean;
  last_scraped_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyListResponse = {
  items: Company[];
  total: number;
  page: number;
  page_size: number;
};

/** Payload for `POST /api/admin/companies`. */
export type CompanyCreateRequest = {
  name: string;
  website_url?: string | null;
  career_page_url_id?: number | null;
  scraping_method_id?: number | null;
  api_endpoint?: string | null;
  is_active: boolean;
};

/** Payload for `PATCH /api/admin/companies/{company_id}`. */
export type CompanyUpdatePatch = {
  name?: string | null;
  website_url?: string | null;
  career_page_url_id?: number | null;
  scraping_method_id?: number | null;
  api_endpoint?: string | null;
  is_active?: boolean | null;
  last_scraped_at?: string | null;
};

/** Form payload — career page is entered as URL text and resolved before the API call. */
export type CompanyFormPayload = {
  name: string;
  website_url?: string | null;
  career_page_url?: string | null;
  scraping_method_id?: number | null;
  api_endpoint?: string | null;
  is_active: boolean;
};

export type CompanyFormUpdatePayload = {
  name?: string | null;
  website_url?: string | null;
  career_page_url?: string | null;
  scraping_method_id?: number | null;
  api_endpoint?: string | null;
  is_active?: boolean | null;
};

/** Filter the list view by active/inactive. `all` means no filter. */
export type CompanyStatusFilter = "all" | "active" | "inactive";

/** Single CSV row that failed validation or FK lookup. */
export type CompanyImportRowError = {
  row: number;
  errors: string[];
};

/** Outcome of `POST /api/admin/companies/import`. */
export type CompanyImportSummary = {
  total_rows: number;
  created: number;
  updated: number;
  failed: number;
  errors: CompanyImportRowError[];
};
