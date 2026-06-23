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

/** Fallback catalog when GET /api/admin/permissions is unavailable (admin-only endpoint). */
export const FALLBACK_PERMISSION_CATALOG: PermissionCatalogItem[] = [
  { key: "users.read", category: "Users", label: "View users", description: "View the user directory and profiles." },
  { key: "users.approve", category: "Users", label: "Approve users", description: "Approve or reject new registrations." },
  { key: "users.change_role", category: "Users", label: "Change user role", description: "Change a user's role label." },
  { key: "users.reset_password", category: "Users", label: "Reset passwords", description: "Reset a user's login password." },
  { key: "users.delete", category: "Users", label: "Delete users", description: "Remove users from the platform." },
  { key: "jobs.read", category: "Jobs", label: "View jobs", description: "View scraped jobs and their applicants." },
  { key: "jobs.edit", category: "Jobs", label: "Edit jobs", description: "Edit job listings." },
  { key: "jobs.delete", category: "Jobs", label: "Delete jobs", description: "Remove job listings." },
  { key: "jobs.mark_scam", category: "Jobs", label: "Mark scam jobs", description: "Flag jobs as scam listings." },
  { key: "applications.read", category: "Applications", label: "View applications", description: "View job applications and files." },
  { key: "applications.edit", category: "Applications", label: "Edit applications", description: "Update application records." },
  { key: "applications.delete", category: "Applications", label: "Delete applications", description: "Remove application records." },
  { key: "companies.read", category: "Companies", label: "View companies", description: "View the companies list." },
  { key: "companies.manage", category: "Companies", label: "Manage companies", description: "Create, edit, and delete companies." },
  { key: "scraping.read", category: "Scraping", label: "View scraping", description: "View scraping configuration and runs." },
  { key: "scraping.manage", category: "Scraping", label: "Manage scraping", description: "Manage scraping methods and runs." },
  { key: "career_urls.read", category: "Career URLs", label: "View career URLs", description: "View career URL entries." },
  { key: "career_urls.manage", category: "Career URLs", label: "Manage career URLs", description: "Create, edit, and delete career URLs." },
  { key: "scam_urls.read", category: "Scam URLs", label: "View Block Lists", description: "View blocked domains and URLs." },
  { key: "scam_urls.manage", category: "Scam URLs", label: "Manage Block Lists", description: "Manage blocked domains and URLs." },
  { key: "stats.read", category: "Analytics", label: "View analytics", description: "View dashboard statistics." },
  { key: "permissions.manage", category: "Permissions", label: "Manage permissions", description: "Edit user permission grants." },
  { key: "api_config.read", category: "API Configuration", label: "View API configuration", description: "View env settings and API keys." },
  { key: "api_config.manage", category: "API Configuration", label: "Manage API configuration", description: "Edit env settings and API keys." },
];

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
