/**
 * Thin wrapper around `fetchWithTimeout` for the admin API. Encapsulates:
 *  - `Authorization: Bearer <token>` injection
 *  - JSON content-type + body serialization
 *  - Backend `AppError`-shaped error parsing
 *  - 401 → dispatches `SESSION_EXPIRED_EVENT` so the AuthProvider can log out
 */
import { apiUrl } from "@/lib/api";
import { SESSION_EXPIRED_EVENT } from "@/lib/auth-token";
import { fetchWithTimeout } from "@/lib/http";

export type ApiErrorBody = {
  error?: { message?: string; code?: string };
  message?: string;
  detail?: string;
};

/** Best-effort message extraction from a non-OK response. */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
  return (
    body.error?.message ??
    body.message ??
    body.detail ??
    fallback
  );
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
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

/**
 * `fetch` with Bearer + JSON + admin-shape error handling.
 *
 * Pass `path` as `/api/v1/...` (it goes through `apiUrl`).
 * Throws `Error(message)` on non-OK responses, with the backend-supplied
 * message when present.
 */
export async function fetchAuthedJson<T>(
  token: string,
  path: string,
  init: AuthedJsonInit = {},
): Promise<T> {
  const { body, headers, timeoutMs, ...rest } = init;

  const isStreamingBody = body instanceof FormData || body instanceof Blob;
  const finalHeaders: Record<string, string> = {
    ...bearerHeader(token) as Record<string, string>,
    ...(headers as Record<string, string> | undefined),
  };
  if (body !== undefined && !isStreamingBody && finalHeaders["Content-Type"] == null) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const finalBody: BodyInit | undefined =
    body === undefined
      ? undefined
      : isStreamingBody
        ? (body as BodyInit)
        : JSON.stringify(body);

  const res = await fetchWithTimeout(
    apiUrl(path),
    {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
      credentials: "omit",
    },
    timeoutMs,
  );

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
 * Resolves with the raw `Response` so the caller can read `.blob()` and headers.
 */
export async function fetchAuthedResponse(
  token: string,
  path: string,
  init: AuthedJsonInit = {},
): Promise<Response> {
  const { body, headers, timeoutMs, ...rest } = init;
  const finalHeaders: Record<string, string> = {
    ...bearerHeader(token) as Record<string, string>,
    ...(headers as Record<string, string> | undefined),
  };
  const res = await fetchWithTimeout(
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
    dispatchSessionExpired();
    throw new Error(await readApiError(res, "Your session has expired. Please sign in again."));
  }
  if (!res.ok) {
    throw new Error(await readApiError(res, `Request failed (${res.status})`));
  }
  return res;
}
