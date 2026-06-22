/**
 * Browser-side client for the admin Permissions API.
 *
 *   GET /api/admin/permissions           — catalog + per-role permissions
 *   PUT /api/admin/permissions/{role}    — update moderator or user permissions
 */
import { filterDisplayCatalog, filterDisplayPermissions } from "@/lib/admin-permissions";
import { API_PATHS } from "@/lib/api-paths";
import { fetchAuthedJson } from "@/lib/fetch-authed";
import type {
  AdminPermissionsResponse,
  MyPermissionsResponse,
  PermissionCatalogItem,
  RolePermissionsEntry,
  UpdateRolePermissionsBody,
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

function normalizeResponse(raw: Record<string, unknown>): AdminPermissionsResponse {
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

export async function getAdminPermissions(token: string): Promise<AdminPermissionsResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(token, BASE);
  return normalizeResponse(raw);
}

/**
 * The signed-in user's own effective permissions. Readable by every role, so it
 * drives menu visibility and page/action gating for admins, moderators, and users
 * alike. The full matrix (`getAdminPermissions`) stays admin-only.
 */
export async function getMyPermissions(token: string): Promise<MyPermissionsResponse> {
  const raw = await fetchAuthedJson<unknown>(token, API_PATHS.adminPermissions.me);
  if (Array.isArray(raw)) {
    return { isAdmin: false, permissions: strArray(raw) };
  }
  if (typeof raw === "object" && raw !== null) {
    const r = raw as Record<string, unknown>;
    return {
      isAdmin: r.is_admin === true || r.isAdmin === true,
      permissions: strArray(r.permissions),
    };
  }
  return { isAdmin: false, permissions: [] };
}

export async function updateRolePermissions(
  token: string,
  role: Exclude<UserRole, "admin">,
  body: UpdateRolePermissionsBody,
): Promise<void> {
  await fetchAuthedJson<unknown>(token, API_PATHS.adminPermissions.role(role), {
    method: "PUT",
    body,
  });
}
