/**
 * Mirrors the `Company` resource served by the backend at
 * `/api/v1/admin/companies` (CRUD + CSV import/export).
 *
 * The backend developer follows the same Companies Management diagram, so the
 * shape here intentionally matches the fields in that diagram.
 */

export type CompanyScrapingMethod = "static" | "api";

export type Company = {
  id: number;
  name: string;
  website_url: string;
  career_page_url: string;
  scraping_method: CompanyScrapingMethod;
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

export type CompanyWritePayload = {
  name: string;
  website_url: string;
  career_page_url: string;
  scraping_method: CompanyScrapingMethod;
  api_endpoint: string | null;
  is_active: boolean;
};

/** Filter the list view by active/inactive. `all` means no filter. */
export type CompanyStatusFilter = "all" | "active" | "inactive";

/** Result returned by `POST /api/v1/admin/companies/import`. */
export type CompanyImportSummary = {
  total_rows: number;
  imported: number;
  updated: number;
  skipped_duplicates: number;
  errors: number;
  error_report_url?: string | null;
  error_messages?: string[];
};
