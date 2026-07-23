import { filterApiConfigSettingsGroups } from "@/components/admin/api-config/api-config-filters";
import type { ApiConfigGroup } from "@/types/api-config-api";

/** Recommended placeholders shown in empty settings fields. */
export const API_CONFIG_FIELD_PLACEHOLDERS: Record<string, string> = {};

/** Filter and order API settings groups for the admin UI. */
export function mergeApiConfigSettingsGroups(apiGroups: ApiConfigGroup[]): ApiConfigGroup[] {
  const filtered = filterApiConfigSettingsGroups(apiGroups);

  const serpapi = filtered.find((g) => g.key === "serpapi");
  const rest = filtered.filter((g) => g.key !== "serpapi");

  const ordered: ApiConfigGroup[] = [];
  if (serpapi) ordered.push(serpapi);
  ordered.push(...rest);
  return ordered;
}

export function getApiConfigFieldPlaceholder(key: string): string | undefined {
  return API_CONFIG_FIELD_PLACEHOLDERS[key];
}

const MULTILINE_QUERY_KEY_PATTERNS = [
  /_TITLE(_ADVANCED)?$/,
  /_DESCRIPTION$/,
  /_QUERY$/,
  /QUERY_/,
] as const;

/** String settings that hold search/query text and should use a multiline textarea. */
export function isApiConfigMultilineQueryField(field: {
  key: string;
  label: string;
  value_type: string;
  is_secret: boolean;
}): boolean {
  if (field.value_type !== "string" || field.is_secret) return false;
  if (/query/i.test(field.label)) return true;
  return MULTILINE_QUERY_KEY_PATTERNS.some((pattern) => pattern.test(field.key));
}
