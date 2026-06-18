/**
 * Browser-side client for the API Configuration admin API.
 *
 * Endpoints:
 *   GET   /api/admin/api-config  — load settings
 *   PATCH /api/admin/api-config  — save settings
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import type {
  ApiConfigField,
  ApiConfigGroup,
  ApiConfigPatchRequest,
  ApiConfigResponse,
  ApiConfigValueType,
} from "@/types/api-config-api";

const BASE = "/api/admin/api-config";

function normalizeValueType(value: unknown): ApiConfigValueType {
  if (value === "int" || value === "bool") return value;
  return "string";
}

function normalizeField(raw: Partial<ApiConfigField> & { key: string }): ApiConfigField {
  return {
    key: raw.key,
    label: typeof raw.label === "string" ? raw.label : raw.key,
    description: typeof raw.description === "string" ? raw.description : null,
    value_type: normalizeValueType(raw.value_type),
    is_secret: raw.is_secret === true,
    value: typeof raw.value === "string" ? raw.value : null,
    is_set: raw.is_set === true,
  };
}

function isRawField(value: unknown): value is Partial<ApiConfigField> & { key: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { key?: unknown }).key === "string"
  );
}

function normalizeGroup(raw: Partial<ApiConfigGroup> & { label: string }, index: number): ApiConfigGroup {
  const rawId = (raw as { id?: unknown }).id;
  const key =
    typeof raw.key === "string"
      ? raw.key
      : typeof rawId === "string"
        ? rawId
        : `group-${index}`;

  const fields = Array.isArray(raw.fields)
    ? (raw.fields as unknown[]).filter(isRawField).map(normalizeField)
    : [];

  return {
    key,
    label: raw.label,
    description: typeof raw.description === "string" ? raw.description : null,
    fields,
  };
}

function isRawGroup(value: unknown): value is Partial<ApiConfigGroup> & { label: string } {
  return typeof value === "object" && value !== null && typeof (value as { label?: unknown }).label === "string";
}

function normalizeApiConfigResponse(raw: Partial<ApiConfigResponse>): ApiConfigResponse {
  const groups = Array.isArray(raw.groups)
    ? (raw.groups as unknown[]).filter(isRawGroup).map(normalizeGroup)
    : [];

  return {
    groups,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

export async function getApiConfig(token: string): Promise<ApiConfigResponse> {
  const raw = await fetchAuthedJson<Partial<ApiConfigResponse>>(token, BASE);
  return normalizeApiConfigResponse(raw);
}

export async function patchApiConfig(
  token: string,
  payload: ApiConfigPatchRequest,
): Promise<ApiConfigResponse> {
  const raw = await fetchAuthedJson<Partial<ApiConfigResponse>>(token, BASE, {
    method: "PATCH",
    body: payload,
  });
  return normalizeApiConfigResponse(raw);
}
