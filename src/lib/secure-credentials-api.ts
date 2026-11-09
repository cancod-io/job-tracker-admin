/**
 * Browser-side client for the Secure Credentials admin vault.
 *
 * Endpoints:
 *   GET    /api/admin/credentials              — list (page, page_size, q, credential_type, owner_user_id)
 *   POST   /api/admin/credentials              — create (201, requires secret; optional owner_user_id)
 *   GET    /api/admin/credentials/{id}         — detail (may include username/notes/secret for edit)
 *   PUT    /api/admin/credentials/{id}         — update (omit secret to keep)
 *   DELETE /api/admin/credentials/{id}         — delete (204)
 *
 * Admin role only. List responses include the decrypted secret so it can be shown or copied.
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { API_PATHS } from "@/lib/api-paths";
import type {
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialListResponse,
  SecureCredentialUpdateRequest,
} from "@/types/secure-credentials";

const BASE = API_PATHS.adminCredentials.base;

export type ListSecureCredentialsParams = {
  page: number;
  page_size: number;
  q?: string;
  credential_type?: CredentialType;
  owner_user_id?: number;
};

const CREDENTIAL_TYPES: readonly CredentialType[] = [
  "pc_login",
  "company_email",
  "two_fa_key",
  "other",
];

function positiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function nonNegativeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function normalizeCredentialType(value: unknown): CredentialType {
  if (typeof value === "string" && CREDENTIAL_TYPES.includes(value as CredentialType)) {
    return value as CredentialType;
  }
  // Legacy value before API Key was replaced by 2FA Key.
  if (value === "api_key") return "other";
  return "other";
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeCredential(
  raw: Partial<SecureCredential> & Record<string, unknown> & { id: number },
): SecureCredential {
  const username =
    typeof raw.username === "string" && raw.username.trim() ? raw.username : null;
  const notes = typeof raw.notes === "string" ? raw.notes : null;
  // Secret only kept when the API explicitly returns it (for edit reveal). Never invent it.
  const secret = typeof raw.secret === "string" && raw.secret.length > 0 ? raw.secret : null;

  return {
    id: raw.id,
    owner_user_id: normalizeNullableNumber(raw.owner_user_id) ?? 0,
    owner_name: normalizeNullableString(raw.owner_name),
    service_name: typeof raw.service_name === "string" ? raw.service_name : "—",
    credential_type: normalizeCredentialType(raw.credential_type),
    username,
    notes,
    secret,
    has_username: raw.has_username === true || Boolean(username),
    has_secret: raw.has_secret === true || Boolean(secret),
    has_notes: raw.has_notes === true || Boolean(notes?.trim()),
    created_by_id: normalizeNullableNumber(raw.created_by_id),
    created_by_name: normalizeNullableString(raw.created_by_name),
    updated_by_id: normalizeNullableNumber(raw.updated_by_id),
    updated_by_name: normalizeNullableString(raw.updated_by_name),
    created_at:
      typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at:
      typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

type RawListResponse = {
  items?: unknown;
  total?: unknown;
  page?: unknown;
  page_size?: unknown;
};

function isRawCredential(value: unknown): value is Partial<SecureCredential> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

function normalizeListResponse(
  raw: RawListResponse,
  requestedPage: number,
  requestedPageSize: number,
): SecureCredentialListResponse {
  const pageSize = positiveInt(raw.page_size, requestedPageSize);
  const page = positiveInt(raw.page, requestedPage);
  const total = nonNegativeInt(raw.total, 0);
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).filter(isRawCredential).map(normalizeCredential)
    : [];

  return { items, total, page, page_size: pageSize };
}

export async function listSecureCredentials(
  token: string,
  params: ListSecureCredentialsParams,
): Promise<SecureCredentialListResponse> {
  const q = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
  });
  const search = params.q?.trim();
  if (search) q.set("q", search);
  if (params.credential_type) q.set("credential_type", params.credential_type);
  if (params.owner_user_id != null && params.owner_user_id > 0) {
    q.set("owner_user_id", String(params.owner_user_id));
  }

  const raw = await fetchAuthedJson<RawListResponse>(token, `${BASE}?${q}`);
  return normalizeListResponse(raw, params.page, params.page_size);
}

export async function getSecureCredential(
  token: string,
  credentialId: number,
): Promise<SecureCredential> {
  const raw = await fetchAuthedJson<Partial<SecureCredential> & { id: number }>(
    token,
    API_PATHS.adminCredentials.detail(credentialId),
  );
  return normalizeCredential(raw);
}

export async function createSecureCredential(
  token: string,
  payload: SecureCredentialCreateRequest,
): Promise<SecureCredential> {
  const raw = await fetchAuthedJson<Partial<SecureCredential> & { id: number }>(token, BASE, {
    method: "POST",
    body: payload,
  });
  return normalizeCredential(raw);
}

export async function updateSecureCredential(
  token: string,
  credentialId: number,
  payload: SecureCredentialUpdateRequest,
): Promise<SecureCredential> {
  const raw = await fetchAuthedJson<Partial<SecureCredential> & { id: number }>(
    token,
    API_PATHS.adminCredentials.detail(credentialId),
    { method: "PUT", body: payload },
  );
  return normalizeCredential(raw);
}

export async function deleteSecureCredential(
  token: string,
  credentialId: number,
): Promise<void> {
  await fetchAuthedJson<void>(token, API_PATHS.adminCredentials.detail(credentialId), {
    method: "DELETE",
  });
}
