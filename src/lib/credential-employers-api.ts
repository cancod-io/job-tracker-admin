/**
 * Admin employer folders (`/api/admin/credential-employers`).
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { API_PATHS } from "@/lib/api-paths";
import type {
  CredentialEmployer,
  CredentialEmployerCreateRequest,
  CredentialEmployerListResponse,
  CredentialEmployerUpdateRequest,
} from "@/types/secure-credentials";

const BASE = API_PATHS.adminCredentialEmployers.base;

function nonNegativeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
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

function normalizeEmployer(
  raw: Partial<CredentialEmployer> & Record<string, unknown> & { id: number },
): CredentialEmployer {
  return {
    id: raw.id,
    owner_user_id: normalizeNullableNumber(raw.owner_user_id) ?? 0,
    owner_name: normalizeNullableString(raw.owner_name),
    name: typeof raw.name === "string" ? raw.name : "Employer",
    website_url: normalizeNullableString(raw.website_url),
    notes: normalizeNullableString(raw.notes),
    sort_order: nonNegativeInt(raw.sort_order, 0),
    credential_count: nonNegativeInt(raw.credential_count, 0),
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

function isRawEmployer(value: unknown): value is Partial<CredentialEmployer> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

export async function listCredentialEmployers(
  token: string,
  ownerUserId?: number,
): Promise<CredentialEmployerListResponse> {
  const q = new URLSearchParams();
  if (ownerUserId != null && ownerUserId > 0) {
    q.set("owner_user_id", String(ownerUserId));
  }
  const path = q.size > 0 ? `${BASE}?${q}` : BASE;
  const raw = await fetchAuthedJson<{ items?: unknown; total?: unknown }>(token, path);
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).filter(isRawEmployer).map(normalizeEmployer)
    : [];
  return { items, total: nonNegativeInt(raw.total, items.length) };
}

export async function createCredentialEmployer(
  token: string,
  payload: CredentialEmployerCreateRequest,
): Promise<CredentialEmployer> {
  const raw = await fetchAuthedJson<Partial<CredentialEmployer> & { id: number }>(token, BASE, {
    method: "POST",
    body: payload,
  });
  return normalizeEmployer(raw);
}

export async function updateCredentialEmployer(
  token: string,
  employerId: number,
  payload: CredentialEmployerUpdateRequest,
): Promise<CredentialEmployer> {
  const raw = await fetchAuthedJson<Partial<CredentialEmployer> & { id: number }>(
    token,
    API_PATHS.adminCredentialEmployers.detail(employerId),
    { method: "PATCH", body: payload },
  );
  return normalizeEmployer(raw);
}

export async function deleteCredentialEmployer(
  token: string,
  employerId: number,
): Promise<void> {
  await fetchAuthedJson<void>(token, API_PATHS.adminCredentialEmployers.detail(employerId), {
    method: "DELETE",
  });
}
