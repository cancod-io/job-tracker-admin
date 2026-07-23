/**
 * Client-side format checks for API keys saved in the vault.
 * Source ids match GET /api/admin/api-config → sources[].id
 */

/** SerpAPI: 64-character hex string */
const SERPAPI_KEY_PATTERN = /^[a-f0-9]{64}$/i;

/** TheirStack API: JWT token (header.payload.signature, base64url) */
const THEIRSTACK_KEY_PATTERN = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const SOURCE_VALIDATORS: Record<string, { pattern: RegExp; hint: string; label: string }> = {
  serpapi: {
    label: "SerpAPI",
    pattern: SERPAPI_KEY_PATTERN,
    hint: "Must be a 64-character hexadecimal string (e.g. 0287aeaba8f9bb4a8f1b0502289b8fe105d4941ef6e23a54c79678ed52625b0d).",
  },
  theirstack: {
    label: "TheirStack API",
    pattern: THEIRSTACK_KEY_PATTERN,
    hint: "Must be a JWT token from the TheirStack dashboard (three base64 segments separated by dots, starting with eyJ…).",
  },
};

/** Example key shown as placeholder / hint text per source. */
export const API_KEY_FORMAT_EXAMPLES: Record<string, string> = {
  serpapi: "64-character hex key",
  theirstack: "eyJ…eyJ…",
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
