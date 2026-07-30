/** Mirrors OpenAPI schemas for `/api/admin/credentials` (secure vault — all users). */

export type CredentialType = "pc_login" | "company_email" | "api_key" | "other";

/**
 * List/detail response.
 * Username and notes may be returned in plaintext; secret is optional (present on detail
 * for reveal in the edit form). Never render secret in the list table.
 */
export type SecureCredential = {
  id: number;
  owner_user_id: number;
  owner_name: string | null;
  service_name: string;
  credential_type: CredentialType;
  username: string | null;
  notes: string | null;
  /** Present when the API returns it (e.g. detail); used only for edit reveal. */
  secret: string | null;
  has_username: boolean;
  has_secret: boolean;
  has_notes: boolean;
  created_by_id: number | null;
  created_by_name: string | null;
  updated_by_id: number | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export type SecureCredentialListResponse = {
  items: SecureCredential[];
  total: number;
  page: number;
  page_size: number;
};

/** Payload for `POST /api/admin/credentials`. Optional owner defaults to the admin. */
export type SecureCredentialCreateRequest = {
  service_name: string;
  credential_type?: CredentialType;
  username?: string | null;
  secret: string;
  notes?: string | null;
  owner_user_id?: number;
};

/** Payload for `PUT /api/admin/credentials/{id}` — omit `secret` to keep existing. */
export type SecureCredentialUpdateRequest = {
  service_name?: string;
  credential_type?: CredentialType;
  username?: string | null;
  secret?: string;
  notes?: string | null;
  clear_username?: boolean;
  clear_notes?: boolean;
};
