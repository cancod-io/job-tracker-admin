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
  return {
    name: form.name,
    website_url: form.website_url ?? null,
  };
}

export async function toCompanyUpdatePatch(
  token: string,
  form: CompanyFormUpdatePayload,
): Promise<CompanyUpdatePatch> {
  const patch: CompanyUpdatePatch = {
    name: form.name ?? null,
    website_url: form.website_url ?? null,
  };

  return patch;
}
