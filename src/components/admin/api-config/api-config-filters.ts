import type { ApiConfigGroup, ApiConfigResponse, ApiConfigSource, ApiKeyListItem } from "@/types/api-config-api";

/** Job sources hidden from the API configuration UI (settings + keys). */
export const HIDDEN_API_CONFIG_SOURCE_IDS = new Set([
  "apify_indeed",
  "fantastic",
  "fantastic_jb",
  "fantastic_jobs",
]);

export function isHiddenApiConfigSource(sourceId: string): boolean {
  return HIDDEN_API_CONFIG_SOURCE_IDS.has(sourceId);
}

export function isHiddenApiConfigGroup(group: ApiConfigGroup): boolean {
  if (isHiddenApiConfigSource(group.key)) return true;
  if (/apify/i.test(group.label)) return true;
  if (/fantastic/i.test(group.label)) return true;
  return (
    group.fields.length > 0 &&
    group.fields.every(
      (field) =>
        field.key.startsWith("APIFY_") ||
        field.key.startsWith("FANTASTIC_JOBS_") ||
        field.key.startsWith("FANTASTIC_JB_"),
    )
  );
}

export function filterApiConfigSources(sources: ApiConfigSource[]): ApiConfigSource[] {
  return sources.filter((source) => !isHiddenApiConfigSource(source.id));
}

export function filterApiConfigKeys(keys: ApiKeyListItem[]): ApiKeyListItem[] {
  return keys.filter((key) => !isHiddenApiConfigSource(key.source));
}

export function filterApiConfigSettingsGroups(groups: ApiConfigGroup[]): ApiConfigGroup[] {
  return groups.filter((group) => !isHiddenApiConfigGroup(group));
}

export function filterApiConfigResponse(config: ApiConfigResponse): ApiConfigResponse {
  return {
    ...config,
    sources: filterApiConfigSources(config.sources),
    keys: filterApiConfigKeys(config.keys),
  };
}
