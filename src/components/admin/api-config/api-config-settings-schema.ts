import { filterApiConfigSettingsGroups } from "@/components/admin/api-config/api-config-filters";
import {
  SERPAPI_QUERY_ACTIVE_KEY,
  SERPAPI_QUERY_ACTIVE_VALUES,
  SERPAPI_QUERY_AI_FULLSTACK_KEY,
  SERPAPI_QUERY_SHOPIFY_KEY,
  isHiddenApiConfigSettingsField,
  isSerpapiQueryActiveField,
} from "@/lib/serpapi-query-settings";
import type { ApiConfigField, ApiConfigGroup } from "@/types/api-config-api";

export {
  SERPAPI_LIVE_QUERY_KEY,
  SERPAPI_QUERY_ACTIVE_KEY,
  SERPAPI_QUERY_ACTIVE_OPTIONS,
  SERPAPI_QUERY_ACTIVE_VALUES,
  SERPAPI_QUERY_AI_FULLSTACK_KEY,
  SERPAPI_QUERY_SHOPIFY_KEY,
  getSerpapiQueryActiveLabel,
  isHiddenApiConfigSettingsField,
  isSerpapiQueryActiveField,
} from "@/lib/serpapi-query-settings";

const SERPAPI_FIELD_ORDER = [
  SERPAPI_QUERY_SHOPIFY_KEY,
  SERPAPI_QUERY_AI_FULLSTACK_KEY,
  SERPAPI_QUERY_ACTIVE_KEY,
] as const;

const SERPAPI_FIELD_LABELS: Record<string, string> = {
  [SERPAPI_QUERY_SHOPIFY_KEY]: "Shopify",
  [SERPAPI_QUERY_AI_FULLSTACK_KEY]: "AI Full Stack",
  [SERPAPI_QUERY_ACTIVE_KEY]: "Active query",
};

const SERPAPI_FIELD_DESCRIPTIONS: Record<string, string> = {
  [SERPAPI_QUERY_SHOPIFY_KEY]: "Search query used when Shopify is the active profile.",
  [SERPAPI_QUERY_AI_FULLSTACK_KEY]:
    "Search query used when AI Full Stack is the active profile.",
  [SERPAPI_QUERY_ACTIVE_KEY]:
    "Only one profile is active at a time. Switch before a run to choose which query SerpAPI uses.",
};

/** Recommended placeholders shown in empty settings fields. */
export const API_CONFIG_FIELD_PLACEHOLDERS: Record<string, string> = {
  [SERPAPI_QUERY_SHOPIFY_KEY]: "Shopify Developer remote",
  [SERPAPI_QUERY_AI_FULLSTACK_KEY]: "AI Full Stack Engineer remote",
};

function transformSerpapiField(field: ApiConfigField): ApiConfigField {
  const label = SERPAPI_FIELD_LABELS[field.key] ?? field.label;
  const description = SERPAPI_FIELD_DESCRIPTIONS[field.key] ?? field.description;

  if (isSerpapiQueryActiveField(field.key)) {
    const fromApi = field.allowed_values?.filter((v) => typeof v === "string" && v.trim()) ?? [];
    return {
      ...field,
      label,
      description,
      allowed_values: fromApi.length > 0 ? fromApi : [...SERPAPI_QUERY_ACTIVE_VALUES],
    };
  }

  if (label !== field.label || description !== field.description) {
    return { ...field, label, description };
  }
  return field;
}

function orderSerpapiFields(fields: ApiConfigField[]): ApiConfigField[] {
  const priority = new Map<string, number>(
    SERPAPI_FIELD_ORDER.map((key, index) => [key, index]),
  );
  return [...fields].sort((a, b) => {
    const ai = priority.get(a.key);
    const bi = priority.get(b.key);
    if (ai == null && bi == null) return 0;
    if (ai == null) return 1;
    if (bi == null) return -1;
    return ai - bi;
  });
}

function transformSerpapiGroup(group: ApiConfigGroup): ApiConfigGroup {
  const fields = orderSerpapiFields(
    group.fields
      .filter((field) => !isHiddenApiConfigSettingsField(field.key))
      .map(transformSerpapiField),
  );
  return { ...group, fields };
}

/** Filter and order API settings groups for the admin UI. */
export function mergeApiConfigSettingsGroups(apiGroups: ApiConfigGroup[]): ApiConfigGroup[] {
  const filtered = filterApiConfigSettingsGroups(apiGroups)
    .map((group) => {
      if (group.key === "serpapi") return transformSerpapiGroup(group);
      const fields = group.fields.filter(
        (field) => !isHiddenApiConfigSettingsField(field.key),
      );
      return fields.length === group.fields.length ? group : { ...group, fields };
    })
    .filter((group) => group.fields.length > 0);

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

/** True when the field should render a single-choice (radio) control. */
export function isApiConfigChoiceField(field: {
  key: string;
  value_type: string;
  is_secret: boolean;
  allowed_values?: string[] | null;
}): boolean {
  if (field.value_type !== "string" || field.is_secret) return false;
  if (isSerpapiQueryActiveField(field.key)) return true;
  return Array.isArray(field.allowed_values) && field.allowed_values.length > 0;
}

/** String settings that hold search/query text and should use a multiline textarea. */
export function isApiConfigMultilineQueryField(field: {
  key: string;
  label: string;
  value_type: string;
  is_secret: boolean;
  allowed_values?: string[] | null;
}): boolean {
  if (field.value_type !== "string" || field.is_secret) return false;
  if (isApiConfigChoiceField(field)) return false;
  if (
    field.key === SERPAPI_QUERY_SHOPIFY_KEY ||
    field.key === SERPAPI_QUERY_AI_FULLSTACK_KEY
  ) {
    return true;
  }
  if (/query/i.test(field.label)) return true;
  return MULTILINE_QUERY_KEY_PATTERNS.some((pattern) => pattern.test(field.key));
}
