/** SerpAPI dual-query profile keys used by API Configuration env settings. */

export const SERPAPI_LIVE_QUERY_KEY = "SERPAPI_QUERY";

export const SERPAPI_QUERY_SHOPIFY_KEY = "SERPAPI_QUERY_SHOPIFY";
export const SERPAPI_QUERY_AI_FULLSTACK_KEY = "SERPAPI_QUERY_AI_FULLSTACK";
export const SERPAPI_QUERY_ACTIVE_KEY = "SERPAPI_QUERY_ACTIVE";

export const SERPAPI_QUERY_ACTIVE_VALUES = ["shopify", "ai_fullstack"] as const;
export type SerpapiQueryActiveValue = (typeof SERPAPI_QUERY_ACTIVE_VALUES)[number];

export const SERPAPI_QUERY_ACTIVE_OPTIONS: ReadonlyArray<{
  value: SerpapiQueryActiveValue;
  label: string;
}> = [
  { value: "shopify", label: "Shopify" },
  { value: "ai_fullstack", label: "AI Full Stack" },
];

export function isHiddenApiConfigSettingsField(key: string): boolean {
  if (key === SERPAPI_LIVE_QUERY_KEY) return true;
  if (key === "DATABASE_URL" || key.startsWith("DATABASE_")) return true;
  if (key.startsWith("POSTGRES_") || key.startsWith("POSTGRESQL_")) return true;
  return false;
}

export function isSerpapiQueryActiveField(key: string): boolean {
  return key === SERPAPI_QUERY_ACTIVE_KEY;
}

export function getSerpapiQueryActiveLabel(value: string): string {
  return SERPAPI_QUERY_ACTIVE_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
}
