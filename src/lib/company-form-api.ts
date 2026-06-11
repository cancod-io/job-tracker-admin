import { findOrCreateCareerUrlId } from "@/lib/company-career-url";
import type {
  CompanyCreateRequest,
  CompanyFormPayload,
  CompanyFormUpdatePayload,
  CompanyUpdatePatch,
} from "@/types/company-api";

export async function toCompanyCreateRequest(
  token: string,
  form: CompanyFormPayload,
): Promise<CompanyCreateRequest> {
  const career_page_url_id = await findOrCreateCareerUrlId(token, form.career_page_url ?? "");
  return {
    name: form.name,
    website_url: form.website_url ?? null,
    career_page_url_id,
    scraping_method_id: form.scraping_method_id ?? null,
    api_endpoint: form.api_endpoint ?? null,
    is_active: form.is_active,
  };
}

export async function toCompanyUpdatePatch(
  token: string,
  form: CompanyFormUpdatePayload,
): Promise<CompanyUpdatePatch> {
  const patch: CompanyUpdatePatch = {
    name: form.name ?? null,
    website_url: form.website_url ?? null,
    scraping_method_id: form.scraping_method_id ?? null,
    api_endpoint: form.api_endpoint ?? null,
    is_active: form.is_active ?? null,
  };

  if (form.career_page_url !== undefined) {
    patch.career_page_url_id = await findOrCreateCareerUrlId(token, form.career_page_url ?? "");
  }

  return patch;
}
