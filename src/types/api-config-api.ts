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
};

export type ApiConfigGroup = {
  key: string;
  label: string;
  description: string | null;
  fields: ApiConfigField[];
};

export type ApiConfigResponse = {
  groups: ApiConfigGroup[];
  updated_at: string | null;
};

/** Payload for `PATCH /api/admin/api-config`. */
export type ApiConfigPatchRequest = {
  values: Record<string, string | null>;
};
