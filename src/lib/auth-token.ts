export const TOKEN_STORAGE_KEY = "sjt_admin_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "sjt_admin_refresh_token";
export const SESSION_EXPIRED_EVENT = "sjt:admin-session-expired";

export function setStoredTokens(accessToken: string, refreshToken?: string | null): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } else {
    window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

