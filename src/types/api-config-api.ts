/** Mirrors OpenAPI schemas for `/api/admin/api-config`. */

export type ApiConfigValueType = "string" | "int" | "bool";

export type ApiConfigField = {
  key: string;
  label: string;
  description: string | null;
  value_type: ApiConfigValueType;
  is_secret: boolean;
  value: string | null;
  is_set: boolean;
  /** When set, the UI renders a single-choice control (e.g. SERPAPI_QUERY_ACTIVE). */
  allowed_values?: string[] | null;
};

export type ApiConfigGroup = {
  key: string;
  label: string;
  description: string | null;
  fields: ApiConfigField[];
};

export type ApiConfigSource = {
  id: string;
  label: string;
  config_key: string;
  active_key_id: number | null;
  is_set: boolean;
};

/** Full key is kept in memory after GET /api/admin/api-config for view/copy; list shows `masked_key` only. */
export type ApiKeyListItem = {
  id: number;
  source: string;
  source_label: string;
  masked_key: string;
  api_key: string | null;
  mailbox: string | null;
  is_active: boolean;
  credits_remaining: string | null;
  credits_updated_at: string | null;
  created_at: string;
};

/** GET /api/admin/api-config — key vault summary. */
export type ApiConfigResponse = {
  sources: ApiConfigSource[];
  keys: ApiKeyListItem[];
  updated_at: string | null;
};

/** GET /api/admin/api-config/settings — env settings (non-key config). */
export type ApiConfigSettingsResponse = {
  groups: ApiConfigGroup[];
  updated_at: string | null;
};

/** PATCH /api/admin/api-config/settings */
export type ApiConfigSettingsPatchRequest = {
  values: Record<string, string | null>;
};

/** POST /api/admin/api-config/keys */
export type ApiKeyCreateRequest = {
  source: string;
  api_key: string;
  mailbox: string;
};

export type ApiKeyDetail = ApiKeyListItem;

export type ApiConfigTab = "settings" | "keys" | "runs";
