/**
 * Client-side format checks for API keys saved in the vault.
 * Source ids match GET /api/admin/api-config → sources[].id
 */

/** Apify: apify_api_FZsdfsrF3iXp8Z0jdObaWdpfCrncAG4xEJlG */
const APIFY_KEY_PATTERN = /^apify_api_[A-Za-z0-9]+$/;

/** SerpAPI: 64-character hex string */
const SERPAPI_KEY_PATTERN = /^[a-f0-9]{64}$/i;

/** Fantastic Jobs (Active ATS): zpka_49700b7cb45341cb9f0cae674810098e_59723b37 */
const FANTASTIC_JOBS_KEY_PATTERN = /^zpka_[a-f0-9]+_[a-f0-9]+$/i;

const SOURCE_VALIDATORS: Record<string, { pattern: RegExp; hint: string; label: string }> = {
  apify_indeed: {
    label: "Apify",
    pattern: APIFY_KEY_PATTERN,
    hint: "Must start with apify_api_ followed by letters and numbers (e.g. apify_api_FZsdfsrF3iXp8Z0jdObaWdpfCrncAG4xEJlG).",
  },
  serpapi: {
    label: "SerpAPI",
    pattern: SERPAPI_KEY_PATTERN,
    hint: "Must be a 64-character hexadecimal string (e.g. 0287aeaba8f9bb4a8f1b0502289b8fe105d4941ef6e23a54c79678ed52625b0d).",
  },
  fantastic_jobs: {
    label: "Fantastic Jobs",
    pattern: FANTASTIC_JOBS_KEY_PATTERN,
    hint: "Must match zpka_<hex>_<hex> (e.g. zpka_49700b7cb45341cb9f0cae674810098e_59723b37).",
  },
};

/** Example key shown as placeholder / hint text per source. */
export const API_KEY_FORMAT_EXAMPLES: Record<string, string> = {
  apify_indeed: "apify_api_…",
  serpapi: "64-character hex key",
  fantastic_jobs: "zpka_…_…",
};

/**
 * Returns an error message when the key does not match the source format, or null if valid.
 * Unknown sources are accepted (no format rule).
 */
export function validateApiKeyForSource(sourceId: string, apiKey: string): string | null {
  const trimmed = apiKey.trim();
  if (!trimmed) return "Enter an API key.";

  const rule = SOURCE_VALIDATORS[sourceId];
  if (!rule) return null;

  if (rule.pattern.test(trimmed)) return null;

  return `Invalid ${rule.label} API key. ${rule.hint}`;
}

/** Human-readable format hint for the selected source, or null if none. */
export function apiKeyFormatHint(sourceId: string): string | null {
  return SOURCE_VALIDATORS[sourceId]?.hint ?? null;
}
