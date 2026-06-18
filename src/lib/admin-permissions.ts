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

const PERMISSION_UI_LABELS: Record<string, string> = {
  "scam_urls.read": "View Block Lists",
  "scam_urls.manage": "Manage Block Lists",
};

/** Display category for the role-permissions UI (may differ from the API catalog). */
export function displayCategoryForPermission(item: PermissionCatalogItem): string {
  if (item.key.startsWith("api_config.")) {
    return "API Configuration";
  }
  if (item.key.startsWith("scam_urls.")) {
    return "Block Lists";
  }
  return replaceScamUrlUiText(item.category);
}

/** User-facing permission label (API catalog may still say "scam URL"). */
export function displayLabelForPermission(item: PermissionCatalogItem): string {
  const mapped = PERMISSION_UI_LABELS[item.key];
  if (mapped) return mapped;
  return replaceScamUrlUiText(item.label);
}

/** User-facing permission description. */
export function displayDescriptionForPermission(item: PermissionCatalogItem): string {
  if (!item.description) return "";
  return replaceScamUrlUiText(item.description);
}

function replaceScamUrlUiText(text: string): string {
  return text
    .replace(/\bscam urls\b/gi, "Block Lists")
    .replace(/\bscam url\b/gi, "Block List")
    .replace(/\bscam-urls\b/gi, "Block Lists")
    .replace(/\bscam-url\b/gi, "Block List");
}

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
    const category = displayCategoryForPermission(item);
    const list = map.get(category) ?? [];
    list.push(item);
    map.set(category, list);
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
