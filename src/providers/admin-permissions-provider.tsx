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
  myRole: UserRole | null;
  myRoleTemplate: string[];
  myUserPermissions: string[];
  catalog: PermissionCatalogItem[];
  matrix: AdminPermissionsResponse | null;
  myPermissions: string[];
  can: (key: string) => boolean;
  refetch: () => Promise<void>;
};

const AdminPermissionsContext = createContext<AdminPermissionsContextValue | null>(null);

export function AdminPermissionsProvider({ children }: { children: ReactNode }) {
  const { accessToken, user, status } = useAuth();
  const [myPermissions, setMyPermissions] = useState<string[]>([]);
  const [myRole, setMyRole] = useState<UserRole | null>(null);
  const [myRoleTemplate, setMyRoleTemplate] = useState<string[]>([]);
  const [myUserPermissions, setMyUserPermissions] = useState<string[]>([]);
  const [backendIsAdmin, setBackendIsAdmin] = useState(false);
  const [matrix, setMatrix] = useState<AdminPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || status !== "authenticated" || !user) {
      setMyPermissions([]);
      setMyRole(null);
      setMyRoleTemplate([]);
      setMyUserPermissions([]);
      setBackendIsAdmin(false);
      setMatrix(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mine = await getMyPermissions(accessToken);

      setMyPermissions(mine.permissions);
      setMyRole(mine.role);
      setMyRoleTemplate(mine.role_template);
      setMyUserPermissions(mine.user_permissions);
      setBackendIsAdmin(mine.isAdmin);

      if (mine.isAdmin) {
        const matrixData = await getAdminPermissions(accessToken).catch(() => null);
        setMatrix(matrixData);
      } else {
        setMatrix(null);
      }
    } catch (e) {
      setMyPermissions([]);
      setMyRole(null);
      setMyRoleTemplate([]);
      setMyUserPermissions([]);
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

  const isAdmin = backendIsAdmin;

  const can = useCallback(
    (key: string) => isAdmin || myPermissions.includes(key),
    [isAdmin, myPermissions],
  );

  const value = useMemo<AdminPermissionsContextValue>(
    () => ({
      loading,
      error,
      isAdmin,
      myRole,
      myRoleTemplate,
      myUserPermissions,
      catalog: matrix?.catalog ?? [],
      matrix,
      myPermissions,
      can,
      refetch: load,
    }),
    [
      loading,
      error,
      isAdmin,
      myRole,
      myRoleTemplate,
      myUserPermissions,
      matrix,
      myPermissions,
      can,
      load,
    ],
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
