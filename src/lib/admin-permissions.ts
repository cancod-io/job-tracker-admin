import type { PermissionCatalogItem } from "@/types/admin-permissions-api";
import type { UserRole } from "@/types/auth";

export function isAdminRole(role: UserRole | string | undefined | null): boolean {
  return role === "admin";
}

/** Admin and moderator can always open the admin console. */
export function isStaffRole(role: UserRole | string | undefined | null): boolean {
  return role === "admin" || role === "moderator";
}

/** Whether a role may access the admin panel without loading the permission matrix. */
export function canAccessAdminPanelByRole(role: UserRole | string | undefined | null): boolean {
  return isStaffRole(role);
}

/** Admin always has every permission; others must be in the granted list. */
export function hasPermission(
  actorRole: UserRole | string | undefined | null,
  granted: readonly string[],
  key: string,
): boolean {
  if (isAdminRole(actorRole)) return true;
  return granted.includes(key);
}

export function permissionsForRole(
  roles: readonly { role: string; permissions: string[] }[],
  role: UserRole | string,
): string[] {
  if (isAdminRole(role)) {
    return roles.find((r) => r.role === "admin")?.permissions ?? [];
  }
  return roles.find((r) => r.role === role)?.permissions ?? [];
}

export type PermissionCategoryGroup = {
  category: string;
  items: PermissionCatalogItem[];
};

/** Permission keys omitted from the role settings UI. */
export const HIDDEN_PERMISSION_KEYS = new Set(["users.ban"]);

export function filterDisplayCatalog(catalog: PermissionCatalogItem[]): PermissionCatalogItem[] {
  return catalog.filter((item) => !HIDDEN_PERMISSION_KEYS.has(item.key));
}

export function filterDisplayPermissions(permissions: readonly string[]): string[] {
  return permissions.filter((key) => !HIDDEN_PERMISSION_KEYS.has(key));
}

export function groupCatalogByCategory(catalog: PermissionCatalogItem[]): PermissionCategoryGroup[] {
  const map = new Map<string, PermissionCatalogItem[]>();
  for (const item of filterDisplayCatalog(catalog)) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

/** Whether a target role has a permission (admin = all catalog keys). */
export function roleHasPermission(
  targetRole: UserRole | string,
  granted: readonly string[],
  key: string,
  catalogKeys?: readonly string[],
): boolean {
  if (isAdminRole(targetRole)) {
    return catalogKeys ? catalogKeys.includes(key) : true;
  }
  return granted.includes(key);
}
