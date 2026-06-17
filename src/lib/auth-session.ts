import { createSessionExpiredError } from "@/lib/auth-errors";
import {
  clearStoredTokens,
  getAccessTokenExpiresAt,
  getStoredAccessToken,
  getStoredRefreshToken,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  REFRESH_BEFORE_EXPIRY_MS,
  setStoredTokens,
  signalSessionExpired,
  signalTokenRefreshed,
} from "@/lib/auth-token";
import { fetchWithTimeout } from "@/lib/http";
import type { TokenResponse } from "@/types/auth";

const REFRESH_URL = "/api/v1/auth/refresh";

let refreshInFlight: Promise<string | null> | null = null;

export function applyTokenResponse(data: TokenResponse): void {
  setStoredTokens(
    data.access_token,
    data.refresh_token,
    data.expires_in,
    data.refresh_expires_in,
  );
  signalTokenRefreshed(data.access_token);
}

export function isTransientNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "AbortError") return true;
  return err.message === "Failed to fetch" || err.message.includes("NetworkError");
}

function withBearer(token: string, init: RequestInit): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  return { ...init, credentials: "omit", headers };
}

async function requestRefresh(): Promise<TokenResponse | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken || isRefreshTokenExpired()) return null;

  const res = await fetchWithTimeout(REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    credentials: "omit",
  });

  if (!res.ok) return null;
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const data = await requestRefresh();
      if (!data?.access_token) return null;
      applyTokenResponse(data);
      return data.access_token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function ensureAccessToken(): Promise<string | null> {
  const token = getStoredAccessToken();
  if (!token) return null;
  if (!isAccessTokenExpired()) return token;
  return refreshAccessToken();
}

function forceLogout(): never {
  clearStoredTokens();
  signalSessionExpired();
  throw createSessionExpiredError();
}

export async function fetchAuthed(
  input: string,
  init: RequestInit = {},
  timeoutMs = 12_000,
): Promise<Response> {
  let token = await ensureAccessToken();
  if (!token) forceLogout();

  let res = await fetchWithTimeout(input, withBearer(token, init), timeoutMs);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      token = newToken;
      res = await fetchWithTimeout(input, withBearer(token, init), timeoutMs);
    }
  }

  if (res.status === 401) forceLogout();

  return res;
}

export function scheduleProactiveRefresh(onRefresh: () => void): () => void {
  if (!getStoredAccessToken()) return () => {};
  const expiresAt = getAccessTokenExpiresAt();
  if (expiresAt == null) return () => {};

  const delay = expiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS;
  if (delay <= 0) {
    onRefresh();
    return () => {};
  }

  const id = window.setTimeout(onRefresh, delay);
  return () => window.clearTimeout(id);
}
