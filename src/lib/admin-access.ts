import {
  adminNavGroups,
  adminNavItems,
  type AdminNavGroup,
  type AdminNavItem,
} from "@/config/admin-nav";

/** Route prefix → minimum permission required to view the page. */
export const ADMIN_ROUTE_PERMISSIONS: Record<string, string> = {
  "/users": "users.read",
  /** Catalog key exists; page still enforces admin role via RequireAdmin. */
  "/settings/secure-credentials": "credentials.read",
};

/** Paths that require administrator role even if a permission key is present. */
export const ADMIN_ONLY_ROUTES = ["/settings/secure-credentials"] as const;

export function permissionForPath(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? "/";
  if (path === "/" || path === "") return "users.read";

  const entries = Object.entries(ADMIN_ROUTE_PERMISSIONS).sort((a, b) => b[0].length - a[0].length);
  for (const [prefix, permission] of entries) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return permission;
  }
  return null;
}

export function isAdminOnlyPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? "/";
  return ADMIN_ONLY_ROUTES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isLeafVisible(
  item: AdminNavItem,
  can: (key: string) => boolean,
  isAdmin: boolean,
): boolean {
  if (item.adminOnly && !isAdmin) return false;
  return !item.permission || can(item.permission);
}

/** Flat visible leaf items (used for first-route / any-access checks). */
export function getVisibleNavItems(
  can: (key: string) => boolean,
  options?: { isAdmin?: boolean },
): AdminNavItem[] {
  const isAdmin = options?.isAdmin === true;
  return adminNavItems.filter((item) => isLeafVisible(item, can, isAdmin));
}

/** Visible nav groups with empty groups removed. */
export function getVisibleNavGroups(
  can: (key: string) => boolean,
  options?: { isAdmin?: boolean },
): AdminNavGroup[] {
  const isAdmin = options?.isAdmin === true;
  return adminNavGroups
    .map((group) => ({
      ...group,
      children: group.children.filter((item) => isLeafVisible(item, can, isAdmin)),
    }))
    .filter((group) => group.children.length > 0);
}

export function getFirstAllowedRoute(
  can: (key: string) => boolean,
  options?: { isAdmin?: boolean },
): string | null {
  const visible = getVisibleNavItems(can, options);
  return visible[0]?.href ?? null;
}

export function hasAnyNavAccess(
  can: (key: string) => boolean,
  options?: { isAdmin?: boolean },
): boolean {
  return getVisibleNavItems(can, options).length > 0;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/" || href === "") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavGroupActive(pathname: string, group: AdminNavGroup): boolean {
  return group.children.some((item) => isNavItemActive(pathname, item.href));
}
