"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { assertUserApproved } from "@/lib/auth-approval";
import {
  apiErrorMessage,
  createLoginAuthError,
  isSessionExpiredError,
  resolveLoginError,
} from "@/lib/auth-errors";
import {
  applyTokenResponse,
  ensureAccessToken,
  isTransientNetworkError,
  refreshAccessToken,
  scheduleProactiveRefresh,
} from "@/lib/auth-session";
import {
  clearStoredTokens,
  getStoredAccessToken,
  SESSION_EXPIRED_EVENT,
  TOKEN_REFRESHED_EVENT,
} from "@/lib/auth-token";
import { apiUrl, getPublicApiUrl } from "@/lib/api";
import { API_PATHS } from "@/lib/api-paths";
import { verifyFaceLogin } from "@/lib/face-auth-api";
import { fetchWithTimeout } from "@/lib/http";
import {
  completeWebAuthnLogin,
  isPasskeyRequiredCode,
  messageForWebAuthnCode,
} from "@/lib/webauthn-api";
import type { AuthUser, RegisterResult, TokenResponse } from "@/types/auth";
import type { FaceDescriptor } from "@/types/face-auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type RegisterPayload = {
  email: string;
  full_name: string;
  password: string;
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  login: (email: string, password: string) => Promise<void>;
  /** Complete admin passkey assertion for the given email (public ceremony). */
  loginWithPasskey: (email: string) => Promise<void>;
  /** Complete face soft-MFA after FACE_REQUIRED (public). */
  loginWithFace: (faceSessionId: string, descriptor: FaceDescriptor) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetchWithTimeout(apiUrl(API_PATHS.auth.me), {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "omit",
  });
  if (res.status === 401) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (!res.ok) {
    throw new Error("Could not load your profile.");
  }
  return (await res.json()) as AuthUser;
}

async function loadUserProfile(): Promise<{ token: string; user: AuthUser } | null> {
  let token = await ensureAccessToken();
  if (!token) return null;

  try {
    const me = await fetchMe(token);
    assertUserApproved(me);
    return { token, user: me };
  } catch (err) {
    if (isSessionExpiredError(err) || (err as { status?: number }).status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) return null;
      token = refreshed;
      const me = await fetchMe(token);
      assertUserApproved(me);
      return { token, user: me };
    }
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearStoredTokens();
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refreshSession = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!getStoredAccessToken()) {
      setUser(null);
      setAccessToken(null);
      setStatus("unauthenticated");
      return;
    }

    try {
      const session = await loadUserProfile();
      if (!session) {
        clearStoredTokens();
        setAccessToken(null);
        setUser(null);
        setStatus("unauthenticated");
        return;
      }
      setAccessToken(session.token);
      setUser(session.user);
      setStatus("authenticated");
    } catch (err) {
      if (isTransientNetworkError(err)) {
        setAccessToken(getStoredAccessToken());
        setUser(null);
        setStatus("loading");
        window.setTimeout(() => void refreshSession(), 2_000);
        return;
      }
      clearStoredTokens();
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const onSessionExpired = () => logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [logout]);

  useEffect(() => {
    const onTokenRefreshed = (event: Event) => {
      const detail = (event as CustomEvent<{ accessToken: string }>).detail;
      if (detail?.accessToken) setAccessToken(detail.accessToken);
    };
    window.addEventListener(TOKEN_REFRESHED_EVENT, onTokenRefreshed);
    return () => window.removeEventListener(TOKEN_REFRESHED_EVENT, onTokenRefreshed);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    return scheduleProactiveRefresh(() => {
      void refreshAccessToken();
    });
  }, [status, accessToken]);

  const applyAuthenticatedSession = useCallback(async (data: TokenResponse) => {
    applyTokenResponse(data);
    const me = await fetchMe(data.access_token);
    try {
      assertUserApproved(me);
    } catch (e) {
      clearStoredTokens();
      throw e;
    }
    setAccessToken(data.access_token);
    setUser(me);
    setStatus("authenticated");
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetchWithTimeout(apiUrl(API_PATHS.auth.login), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(
          `Could not reach the API at ${getPublicApiUrl()} (timed out). Ensure the backend is running and NEXT_PUBLIC_API_URL is correct.`,
        );
      }
      throw e;
    }
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as Parameters<typeof resolveLoginError>[0];
      const resolved = resolveLoginError(err);
      if (isPasskeyRequiredCode(resolved.code)) {
        throw createLoginAuthError({
          message: messageForWebAuthnCode(resolved.code, resolved.message),
          code: resolved.code,
          fields: [],
          faceSessionId: null,
        });
      }
      // FACE_REQUIRED includes faceSessionId from details — do not apply tokens.
      throw createLoginAuthError(resolved);
    }
    const data = (await res.json()) as TokenResponse;
    await applyAuthenticatedSession(data);
  }, [applyAuthenticatedSession]);

  const loginWithPasskey = useCallback(
    async (email: string) => {
      const trimmed = email.trim();
      if (!trimmed) {
        throw createLoginAuthError({
          message: "Enter your email to sign in with a passkey.",
          code: "LOGIN_FIELDS_MISSING",
          fields: ["email"],
          faceSessionId: null,
        });
      }
      try {
        const data = await completeWebAuthnLogin(trimmed);
        await applyAuthenticatedSession(data);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          throw new Error(
            `Could not reach the API at ${getPublicApiUrl()} (timed out). Ensure the backend is running and NEXT_PUBLIC_API_URL is correct.`,
          );
        }
        // FACE_REQUIRED from passkey verify is rethrown with faceSessionId; no tokens yet.
        throw e;
      }
    },
    [applyAuthenticatedSession],
  );

  const loginWithFace = useCallback(
    async (faceSessionId: string, descriptor: FaceDescriptor) => {
      const sessionId = faceSessionId.trim();
      if (!sessionId) {
        throw createLoginAuthError({
          message: "Face verification session is missing. Please sign in again.",
          code: "FACE_SESSION_INVALID",
          fields: [],
          faceSessionId: null,
        });
      }
      try {
        const data = await verifyFaceLogin(sessionId, descriptor);
        await applyAuthenticatedSession(data);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          throw new Error(
            `Could not reach the API at ${getPublicApiUrl()} (timed out). Ensure the backend is running and NEXT_PUBLIC_API_URL is correct.`,
          );
        }
        throw e;
      }
    },
    [applyAuthenticatedSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<RegisterResult> => {
      let res: Response;
      try {
        res = await fetchWithTimeout(apiUrl(API_PATHS.auth.register), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload.email,
            full_name: payload.full_name,
            password: payload.password,
          }),
        });
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          throw new Error(
            `Could not reach the API at ${getPublicApiUrl()} (timed out). Ensure the backend is running and NEXT_PUBLIC_API_URL is correct.`,
          );
        }
        throw e;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
          detail?: unknown;
        };
        const message =
          apiErrorMessage(err) ??
          (typeof err.detail === "string" ? err.detail : null) ??
          "Registration failed";
        throw new Error(message);
      }
      const created = (await res.json()) as AuthUser;
      // Email verification is required before login; show that step first.
      if (created.email_verified !== true) {
        return { status: "needs_verification", email: payload.email };
      }
      if (created.approval_status === "pending") {
        return { status: "pending", email: payload.email };
      }
      await login(payload.email, payload.password);
      return { status: "authenticated" };
    },
    [login],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken,
      register,
      login,
      loginWithPasskey,
      loginWithFace,
      logout,
      refreshSession,
    }),
    [
      status,
      user,
      accessToken,
      register,
      login,
      loginWithPasskey,
      loginWithFace,
      logout,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
