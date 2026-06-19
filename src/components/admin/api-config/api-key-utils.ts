import type { ApiConfigResponse, ApiKeyListItem } from "@/types/api-config-api";

/** Keep table order stable (oldest first) — never sort by active status. */
export function sortApiKeysStable(keys: ApiKeyListItem[]): ApiKeyListItem[] {
  return [...keys].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.id - b.id;
  });
}

export function withStableKeyOrder(config: ApiConfigResponse): ApiConfigResponse {
  return { ...config, keys: sortApiKeysStable(config.keys) };
}

/** Update vault state after activate without re-fetching (row stays in place). */
export function applyKeyActivation(
  config: ApiConfigResponse,
  activated: ApiKeyListItem,
): ApiConfigResponse {
  return {
    ...config,
    keys: sortApiKeysStable(
      config.keys.map((key) => {
        if (key.source !== activated.source) return key;
        if (key.id === activated.id) return { ...key, ...activated, is_active: true };
        return { ...key, is_active: false };
      }),
    ),
    sources: config.sources.map((source) =>
      source.id === activated.source
        ? { ...source, is_set: true, active_key_id: activated.id }
        : source,
    ),
  };
}
