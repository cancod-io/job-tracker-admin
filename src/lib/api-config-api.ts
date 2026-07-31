/**
 * Browser-side client for the API Configuration admin API.
 *
 * Key vault:
 *   GET    /api/admin/api-config
 *   GET    /api/admin/api-config/keys
 *   POST   /api/admin/api-config/keys
 *   POST   /api/admin/api-config/keys/{key_id}/activate
 *   DELETE /api/admin/api-config/keys/{key_id}
 *
 * Env settings:
 *   GET   /api/admin/api-config/settings
 *   PATCH /api/admin/api-config/settings
 *   GET   /api/admin/api-config/settings/{group_id}
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { API_PATHS } from "@/lib/api-paths";
import { maskApiKeyDisplay } from "@/lib/api-key-mask";
import type {
  ApiConfigField,
  ApiConfigGroup,
  ApiConfigResponse,
  ApiConfigSettingsPatchRequest,
  ApiConfigSettingsResponse,
  ApiConfigSource,
  ApiConfigValueType,
  ApiKeyCreateRequest,
  ApiKeyListItem,
} from "@/types/api-config-api";

const BASE = API_PATHS.adminApiConfig.base;
const SETTINGS_BASE = API_PATHS.adminApiConfig.settings;

function normalizeValueType(value: unknown): ApiConfigValueType {
  if (value === "int" || value === "bool") return value;
  return "string";
}

function normalizeAllowedValues(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const values = value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  return values.length > 0 ? values : null;
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
    allowed_values: normalizeAllowedValues(
      (raw as Partial<ApiConfigField> & { allowed_values?: unknown }).allowed_values,
    ),
  };
}

function isRawField(value: unknown): value is Partial<ApiConfigField> & { key: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { key?: unknown }).key === "string"
  );
}

function normalizeGroup(
  raw: Partial<ApiConfigGroup> & { label: string },
  index: number,
): ApiConfigGroup {
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
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { label?: unknown }).label === "string"
  );
}

function normalizeNumericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeCreditsRemaining(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function normalizeSource(raw: Partial<ApiConfigSource> & { id: string }): ApiConfigSource {
  return {
    id: raw.id,
    label: typeof raw.label === "string" ? raw.label : raw.id,
    config_key: typeof raw.config_key === "string" ? raw.config_key : raw.id,
    active_key_id: normalizeNumericId(raw.active_key_id),
    is_set: raw.is_set === true,
  };
}

function isRawSource(value: unknown): value is Partial<ApiConfigSource> & { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "string"
  );
}

function normalizeKey(
  raw: Partial<ApiKeyListItem> & { id: number; api_key?: unknown; mailbox?: unknown },
): ApiKeyListItem {
  const api_key = typeof raw.api_key === "string" ? raw.api_key : null;
  const maskedFromBackend = typeof raw.masked_key === "string" ? raw.masked_key.trim() : "";
  const masked_key = api_key
    ? maskApiKeyDisplay(api_key)
    : maskedFromBackend || "••••";

  return {
    id: raw.id,
    source: typeof raw.source === "string" ? raw.source : "",
    source_label: typeof raw.source_label === "string" ? raw.source_label : raw.source ?? "",
    masked_key,
    api_key,
    mailbox: typeof raw.mailbox === "string" ? raw.mailbox : null,
    is_active: raw.is_active === true,
    credits_remaining: normalizeCreditsRemaining(raw.credits_remaining),
    credits_updated_at:
      typeof raw.credits_updated_at === "string" ? raw.credits_updated_at : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
  };
}

function isRawKey(value: unknown): value is Partial<ApiKeyListItem> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

function normalizeVaultResponse(raw: Record<string, unknown>): ApiConfigResponse {
  const updated_at = typeof raw.updated_at === "string" ? raw.updated_at : null;

  const sources = Array.isArray(raw.sources)
    ? (raw.sources as unknown[]).filter(isRawSource).map(normalizeSource)
    : [];

  const keys = Array.isArray(raw.keys)
    ? (raw.keys as unknown[]).filter(isRawKey).map(normalizeKey)
    : [];

  return { sources, keys, updated_at };
}

function normalizeSettingsResponse(raw: Record<string, unknown>): ApiConfigSettingsResponse {
  const updated_at = typeof raw.updated_at === "string" ? raw.updated_at : null;

  const groups = Array.isArray(raw.groups)
    ? (raw.groups as unknown[]).filter(isRawGroup).map(normalizeGroup)
    : [];

  return { groups, updated_at };
}

export async function getApiConfig(token: string): Promise<ApiConfigResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(token, BASE);
  return normalizeVaultResponse(raw);
}

export async function getApiConfigSettings(token: string): Promise<ApiConfigSettingsResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(token, SETTINGS_BASE);
  return normalizeSettingsResponse(raw);
}

export async function getApiConfigSettingsGroup(
  token: string,
  groupId: string,
): Promise<ApiConfigGroup> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminApiConfig.settingsGroup(groupId),
  );
  return normalizeGroup(raw as Partial<ApiConfigGroup> & { label: string }, 0);
}

export async function patchApiConfigSettings(
  token: string,
  payload: ApiConfigSettingsPatchRequest,
): Promise<ApiConfigSettingsResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(token, SETTINGS_BASE, {
    method: "PATCH",
    body: payload,
  });
  return normalizeSettingsResponse(raw);
}

export async function listApiKeys(
  token: string,
  params?: { source?: string },
): Promise<ApiKeyListItem[]> {
  const search = params?.source ? `?source=${encodeURIComponent(params.source)}` : "";
  const raw = await fetchAuthedJson<unknown[]>(token, `${API_PATHS.adminApiConfig.keys}${search}`);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRawKey).map(normalizeKey);
}

export async function createApiKey(
  token: string,
  payload: ApiKeyCreateRequest,
): Promise<ApiKeyListItem> {
  const raw = await fetchAuthedJson<Partial<ApiKeyListItem> & { id: number }>(
    token,
    API_PATHS.adminApiConfig.keys,
    {
      method: "POST",
      body: payload,
    },
  );
  return normalizeKey(raw);
}

export async function activateApiKey(token: string, keyId: number): Promise<ApiKeyListItem> {
  const raw = await fetchAuthedJson<Partial<ApiKeyListItem> & { id: number }>(
    token,
    API_PATHS.adminApiConfig.keyActivate(keyId),
    { method: "POST" },
  );
  return normalizeKey(raw);
}

export async function deleteApiKey(token: string, keyId: number): Promise<void> {
  await fetchAuthedJson<void>(token, API_PATHS.adminApiConfig.keyDelete(keyId), { method: "DELETE" });
}
