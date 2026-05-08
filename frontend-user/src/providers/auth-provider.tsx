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
import { apiErrorCode, apiErrorMessage } from "@/lib/auth-errors";
import { apiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/http";
import type { AuthUser, RegisterResult, TokenResponse } from "@/types/auth";

const TOKEN_STORAGE_KEY = "sjt_user_access_token";

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
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetchWithTimeout(apiUrl("/api/v1/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "omit",
  });
  if (!res.ok) {
    throw new Error("Unauthorized");
  }
  return (await res.json()) as AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refreshSession = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      setAccessToken(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const me = await fetchMe(token);
      setAccessToken(token);
      setUser(me);
      setStatus("authenticated");
    } catch {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetchWithTimeout(apiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(
          "Could not reach the API (timed out). Set NEXT_PUBLIC_API_URL to a URL your browser can open (e.g. http://localhost:8000).",
        );
      }
      throw e;
    }
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as {
        error?: { message?: string; code?: string };
        detail?: unknown;
      };
      const message =
        apiErrorMessage(err) ??
        (typeof err.detail === "string" ? err.detail : null) ??
        "Sign-in failed";
      const e = new Error(message) as Error & { code?: string };
      const code = apiErrorCode(err);
      if (code) e.code = code;
      throw e;
    }
    const data = (await res.json()) as TokenResponse;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    }
    const me = await fetchMe(data.access_token);
    setAccessToken(data.access_token);
    setUser(me);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload): Promise<RegisterResult> => {
      let res: Response;
      try {
        res = await fetchWithTimeout(apiUrl("/api/v1/auth/register"), {
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
            "Could not reach the API (timed out). Set NEXT_PUBLIC_API_URL to a URL your browser can open (e.g. http://localhost:8000).",
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
      logout,
      refreshSession,
    }),
    [status, user, accessToken, register, login, logout, refreshSession],
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
