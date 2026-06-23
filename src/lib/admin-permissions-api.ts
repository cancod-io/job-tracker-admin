/**
 * Browser-side client for the admin Permissions API.
 *
 *   GET /api/admin/permissions                    — permission catalog (admin only)
 *   GET /api/admin/permissions/me                 — signed-in user's effective permissions
 *   GET /api/admin/permissions/users/{user_id}    — one user's stored grants
 *   PUT /api/admin/permissions/users/{user_id}    — replace one user's grants
 */
import {
  FALLBACK_PERMISSION_CATALOG,
  filterDisplayCatalog,
  filterDisplayPermissions,
} from "@/lib/admin-permissions";
import { API_PATHS } from "@/lib/api-paths";
import { fetchAuthedJson } from "@/lib/fetch-authed";
import type {
  AdminPermissionsResponse,
  MyPermissionsResponse,
  PermissionCatalogItem,
  RolePermissionsEntry,
  UpdateUserPermissionsBody,
  UserPermissionsResponse,
} from "@/types/admin-permissions-api";
import type { UserRole } from "@/types/auth";

const BASE = API_PATHS.adminPermissions.base;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function normalizeRole(value: unknown): UserRole {
  if (value === "admin" || value === "moderator" || value === "user") return value;
  return "user";
}

function normalizeCatalogItem(raw: unknown): PermissionCatalogItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const key = str(r.key);
  if (!key) return null;
  return {
    key,
    category: str(r.category, "Other"),
    label: str(r.label, key),
    description: str(r.description),
  };
}

function normalizeRoleEntry(raw: unknown): RolePermissionsEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const role = str(r.role);
  if (!role) return null;
  return {
    role,
    editable: r.editable !== false && role !== "admin",
    permissions: strArray(r.permissions),
  };
}

function normalizeCatalogResponse(raw: Record<string, unknown>): AdminPermissionsResponse {
  const catalogRaw = Array.isArray(raw.catalog) ? raw.catalog : [];
  const rolesRaw = Array.isArray(raw.roles) ? raw.roles : [];

  const catalog = filterDisplayCatalog(
    catalogRaw
      .map(normalizeCatalogItem)
      .filter((v): v is PermissionCatalogItem => v != null),
  );

  const roles = rolesRaw
    .map(normalizeRoleEntry)
    .filter((v): v is RolePermissionsEntry => v != null)
    .map((entry) => ({
      ...entry,
      permissions: filterDisplayPermissions(entry.permissions),
    }));

  return { catalog, roles };
}

function normalizeMyPermissions(raw: Record<string, unknown>): MyPermissionsResponse {
  return {
    role: normalizeRole(raw.role),
    isAdmin: raw.is_admin === true || raw.isAdmin === true,
    permissions: strArray(raw.permissions),
    role_template: strArray(raw.role_template),
    user_permissions: strArray(raw.user_permissions),
  };
}

function normalizeUserPermissions(raw: Record<string, unknown>): UserPermissionsResponse {
  return {
    user_id: typeof raw.user_id === "number" ? raw.user_id : Number(raw.user_id) || 0,
    role: normalizeRole(raw.role),
    editable: raw.editable !== false,
    role_template: strArray(raw.role_template),
    user_permissions: filterDisplayPermissions(strArray(raw.user_permissions)),
    effective_permissions: filterDisplayPermissions(strArray(raw.effective_permissions)),
  };
}

async function fetchPermissionCatalogResponse(token: string): Promise<AdminPermissionsResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(token, BASE);
  return normalizeCatalogResponse(raw);
}

/** Catalog for the user permissions editor — API catalog when available, otherwise fallback. */
export async function getPermissionCatalog(token: string): Promise<PermissionCatalogItem[]> {
  try {
    const response = await fetchPermissionCatalogResponse(token);
    if (response.catalog.length > 0) return response.catalog;
  } catch {
    // Non-admin callers cannot read the catalog endpoint; use the static fallback.
  }
  return filterDisplayCatalog(FALLBACK_PERMISSION_CATALOG);
}

/**
 * The signed-in user's own effective permissions. Readable by every role and drives
 * menu visibility and page/action gating.
 */
export async function getMyPermissions(token: string): Promise<MyPermissionsResponse> {
  const raw = await fetchAuthedJson<unknown>(token, API_PATHS.adminPermissions.me);
  if (Array.isArray(raw)) {
    return {
      role: "user",
      isAdmin: false,
      permissions: strArray(raw),
      role_template: [],
      user_permissions: strArray(raw),
    };
  }
  if (typeof raw === "object" && raw !== null) {
    return normalizeMyPermissions(raw as Record<string, unknown>);
  }
  return {
    role: "user",
    isAdmin: false,
    permissions: [],
    role_template: [],
    user_permissions: [],
  };
}

export async function getUserPermissions(
  token: string,
  userId: number,
): Promise<UserPermissionsResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminPermissions.user(userId),
  );
  return normalizeUserPermissions(raw);
}

export async function updateUserPermissions(
  token: string,
  userId: number,
  body: UpdateUserPermissionsBody,
): Promise<UserPermissionsResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminPermissions.user(userId),
    {
      method: "PUT",
      body,
    },
  );
  return normalizeUserPermissions(raw);
}
