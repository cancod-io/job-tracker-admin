import { adminNavItems } from "@/config/admin-nav";

/** Route prefix → minimum permission required to view the page. */
export const ADMIN_ROUTE_PERMISSIONS: Record<string, string> = {
  "/jobs": "jobs.read",
  "/users": "users.read",
  "/companies": "companies.read",
  "/career-urls": "career_urls.read",
  "/permissions": "permissions.manage",
  "/scrapers": "scraping.read",
  "/logs": "scraping.read",
};

export function permissionForPath(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? "/";
  if (path === "/" || path === "") return "jobs.read";

  const entries = Object.entries(ADMIN_ROUTE_PERMISSIONS).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [prefix, permission] of entries) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return permission;
  }
  return null;
}

export function getVisibleNavItems(can: (key: string) => boolean) {
  return adminNavItems.filter((item) => !item.permission || can(item.permission));
}

export function getFirstAllowedRoute(can: (key: string) => boolean): string | null {
  const visible = getVisibleNavItems(can);
  return visible[0]?.href ?? null;
}

export function hasAnyNavAccess(can: (key: string) => boolean): boolean {
  return getVisibleNavItems(can).length > 0;
}
