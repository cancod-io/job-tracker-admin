/**
 * Thin wrapper around `fetchWithTimeout` for the admin API. Encapsulates:
 *  - `Authorization: Bearer <token>` injection
 *  - JSON content-type + body serialization
 *  - Backend `AppError`-shaped error parsing
 *  - Proactive refresh from `expires_in`, retry on 401, logout only when refresh fails
 */
import { apiUrl } from "@/lib/api";
import { ensureAccessToken, refreshAccessToken } from "@/lib/auth-session";
import {
  clearStoredTokens,
  getStoredAccessToken,
  isAccessTokenExpired,
  signalSessionExpired,
} from "@/lib/auth-token";
import { fetchWithTimeout } from "@/lib/http";

export type ApiErrorBody = {
  error?: { message?: string; code?: string };
  message?: string;
  detail?: string;
};

/** Best-effort message extraction from a non-OK response. */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
  return body.error?.message ?? body.message ?? body.detail ?? fallback;
}

export function bearerHeader(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export type AuthedJsonInit = Omit<RequestInit, "body" | "headers"> & {
  /** Plain object → JSON-serialized; `FormData` / `Blob` → sent as-is. */
  body?: unknown;
  headers?: HeadersInit;
  /** Override the default 12s timeout (e.g. long-running exports). */
  timeoutMs?: number;
};

function dispatchSessionExpired(): void {
  clearStoredTokens();
  signalSessionExpired();
}

async function resolveAccessToken(passedToken: string): Promise<string | null> {
  const stored = getStoredAccessToken();
  const token = passedToken?.trim() || stored;
  if (!token) return null;

  if (!isAccessTokenExpired()) return token;
  return ensureAccessToken();
}

async function authedFetch(token: string, path: string, init: AuthedJsonInit): Promise<Response> {
  const { body, headers, timeoutMs, ...rest } = init;
  const isStreamingBody = body instanceof FormData || body instanceof Blob;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Authorization", `Bearer ${token}`);
  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json");
  }
  if (body !== undefined && !isStreamingBody && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const finalBody: BodyInit | undefined =
    body === undefined ? undefined : isStreamingBody ? (body as BodyInit) : JSON.stringify(body);

  return fetchWithTimeout(
    apiUrl(path),
    {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
      credentials: "omit",
    },
    timeoutMs,
  );
}

/**
 * `fetch` with Bearer + JSON + admin-shape error handling.
 *
 * Pass `path` as `/api/v1/...` or `/api/admin/...` (it goes through `apiUrl`).
 */
export async function fetchAuthedJson<T>(
  token: string,
  path: string,
  init: AuthedJsonInit = {},
): Promise<T> {
  let accessToken = await resolveAccessToken(token);
  if (!accessToken) {
    dispatchSessionExpired();
    throw new Error("Your session has expired. Please sign in again.");
  }

  let res = await authedFetch(accessToken, path, init);

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      accessToken = refreshed;
      res = await authedFetch(accessToken, path, init);
    }
  }

  if (res.status === 401) {
    dispatchSessionExpired();
    throw new Error(await readApiError(res, "Your session has expired. Please sign in again."));
  }
  if (!res.ok) {
    throw new Error(await readApiError(res, `Request failed (${res.status})`));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

/**
 * Variant for endpoints that return a binary body (CSV export, etc.).
 */
export async function fetchAuthedResponse(
  token: string,
  path: string,
  init: AuthedJsonInit = {},
): Promise<Response> {
  let accessToken = await resolveAccessToken(token);
  if (!accessToken) {
    dispatchSessionExpired();
    throw new Error("Your session has expired. Please sign in again.");
  }

  const { body, headers, timeoutMs, ...rest } = init;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Authorization", `Bearer ${accessToken}`);

  let res = await fetchWithTimeout(
    apiUrl(path),
    {
      ...rest,
      headers: finalHeaders,
      body: body as BodyInit | undefined,
      credentials: "omit",
    },
    timeoutMs,
  );

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      accessToken = refreshed;
      finalHeaders.set("Authorization", `Bearer ${accessToken}`);
      res = await fetchWithTimeout(
        apiUrl(path),
        {
          ...rest,
          headers: finalHeaders,
          body: body as BodyInit | undefined,
          credentials: "omit",
        },
        timeoutMs,
      );
    }
  }

  if (res.status === 401) {
    dispatchSessionExpired();
    throw new Error(await readApiError(res, "Your session has expired. Please sign in again."));
  }
  if (!res.ok) {
    throw new Error(await readApiError(res, `Request failed (${res.status})`));
  }
  return res;
}
