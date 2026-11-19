/**
 * Admin named identities (`/api/admin/credential-identities`).
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { API_PATHS } from "@/lib/api-paths";
import type {
  CredentialIdentity,
  CredentialIdentityCreateRequest,
  CredentialIdentityListResponse,
  CredentialIdentityUpdateRequest,
} from "@/types/secure-credentials";

const BASE = API_PATHS.adminCredentialIdentities.base;

function normalizeIdentity(
  raw: Partial<CredentialIdentity> & Record<string, unknown> & { id: number },
): CredentialIdentity {
  return {
    id: raw.id,
    owner_user_id: typeof raw.owner_user_id === "number" ? raw.owner_user_id : 0,
    owner_name: typeof raw.owner_name === "string" ? raw.owner_name : null,
    display_name: typeof raw.display_name === "string" ? raw.display_name : "Identity",
    country_code: typeof raw.country_code === "string" ? raw.country_code : null,
    notes: typeof raw.notes === "string" ? raw.notes : null,
    credential_count: typeof raw.credential_count === "number" ? raw.credential_count : 0,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

function isRawIdentity(value: unknown): value is Partial<CredentialIdentity> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

export async function listCredentialIdentities(
  token: string,
  ownerUserId?: number,
): Promise<CredentialIdentityListResponse> {
  const q = new URLSearchParams();
  if (ownerUserId != null && ownerUserId > 0) {
    q.set("owner_user_id", String(ownerUserId));
  }
  const path = q.size > 0 ? `${BASE}?${q}` : BASE;
  const raw = await fetchAuthedJson<{ items?: unknown; total?: unknown }>(token, path);
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).filter(isRawIdentity).map(normalizeIdentity)
    : [];
  return {
    items,
    total: typeof raw.total === "number" ? raw.total : items.length,
  };
}

export async function createCredentialIdentity(
  token: string,
  payload: CredentialIdentityCreateRequest,
): Promise<CredentialIdentity> {
  const raw = await fetchAuthedJson<Partial<CredentialIdentity> & { id: number }>(token, BASE, {
    method: "POST",
    body: payload,
  });
  return normalizeIdentity(raw);
}

export async function updateCredentialIdentity(
  token: string,
  identityId: number,
  payload: CredentialIdentityUpdateRequest,
): Promise<CredentialIdentity> {
  const raw = await fetchAuthedJson<Partial<CredentialIdentity> & { id: number }>(
    token,
    API_PATHS.adminCredentialIdentities.detail(identityId),
    { method: "PATCH", body: payload },
  );
  return normalizeIdentity(raw);
}

export async function deleteCredentialIdentity(token: string, identityId: number): Promise<void> {
  await fetchAuthedJson<void>(token, API_PATHS.adminCredentialIdentities.detail(identityId), {
    method: "DELETE",
  });
}
