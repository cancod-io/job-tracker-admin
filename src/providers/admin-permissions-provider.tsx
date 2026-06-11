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
import { getAdminPermissions, getMyPermissions } from "@/lib/admin-permissions-api";
import { isAdminRole, permissionsForRole } from "@/lib/admin-permissions";
import { useAuth } from "@/providers/auth-provider";
import type {
  AdminPermissionsResponse,
  PermissionCatalogItem,
} from "@/types/admin-permissions-api";
import type { UserRole } from "@/types/auth";

type AdminPermissionsContextValue = {
  loading: boolean;
  error: string | null;
  /** Backend-confirmed full access — gate "show everything" on this, not the role name. */
  isAdmin: boolean;
  catalog: PermissionCatalogItem[];
  matrix: AdminPermissionsResponse | null;
  myPermissions: string[];
  can: (key: string) => boolean;
  refetch: () => Promise<void>;
};

const AdminPermissionsContext = createContext<AdminPermissionsContextValue | null>(null);

export function AdminPermissionsProvider({ children }: { children: ReactNode }) {
  const { accessToken, user, status } = useAuth();
  // The signed-in user's own effective permissions — works for every role and is
  // the single source of truth for menu visibility and page/action gating.
  const [myPermissions, setMyPermissions] = useState<string[]>([]);
  const [backendIsAdmin, setBackendIsAdmin] = useState(false);
  // Full catalog + per-role matrix. Only the admin Role Permissions editor needs it,
  // and only admins are allowed to read it; other roles keep this null.
  const [matrix, setMatrix] = useState<AdminPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || status !== "authenticated" || !user) {
      setMyPermissions([]);
      setBackendIsAdmin(false);
      setMatrix(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Source of truth: the caller's own permissions (readable by every role).
      const mine = await getMyPermissions(accessToken);
      setMyPermissions(mine.permissions);
      setBackendIsAdmin(mine.isAdmin);

      // The full matrix powers the admin-only Role Permissions editor. Load it only
      // for admins — moderators/users are forbidden from reading it (403) and never
      // need it for their own gating.
      if (mine.isAdmin || isAdminRole(user.role)) {
        try {
          setMatrix(await getAdminPermissions(accessToken));
        } catch {
          // The editor will show "no data"; not fatal to the rest of the console.
          setMatrix(null);
        }
      } else {
        setMatrix(null);
      }
    } catch (e) {
      // Could not determine the user's permissions — fail closed and surface why.
      setMyPermissions([]);
      setBackendIsAdmin(false);
      setMatrix(null);
      setError(e instanceof Error ? e.message : "Failed to load your permissions.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, status, user]);

  useEffect(() => {
    void load();
  }, [load]);

  // Trust the backend flag; fall back to the role name only if the API omits it.
  const isAdmin = backendIsAdmin || isAdminRole(user?.role);

  const can = useCallback(
    (key: string) => isAdmin || myPermissions.includes(key),
    [isAdmin, myPermissions],
  );

  const value = useMemo<AdminPermissionsContextValue>(
    () => ({
      loading,
      error,
      isAdmin,
      catalog: matrix?.catalog ?? [],
      matrix,
      myPermissions,
      can,
      refetch: load,
    }),
    [loading, error, isAdmin, matrix, myPermissions, can, load],
  );

  return (
    <AdminPermissionsContext.Provider value={value}>{children}</AdminPermissionsContext.Provider>
  );
}

export function useAdminPermissions(): AdminPermissionsContextValue {
  const ctx = useContext(AdminPermissionsContext);
  if (!ctx) {
    throw new Error("useAdminPermissions must be used within AdminPermissionsProvider");
  }
  return ctx;
}

export function useAdminPermissionsOptional(): AdminPermissionsContextValue | null {
  return useContext(AdminPermissionsContext);
}

export function permissionsForTargetRole(
  matrix: AdminPermissionsResponse | null,
  role: UserRole | string,
): string[] {
  if (!matrix) return [];
  if (isAdminRole(role)) return matrix.catalog.map((c) => c.key);
  return permissionsForRole(matrix.roles, role);
}
