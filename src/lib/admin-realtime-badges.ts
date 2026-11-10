export type RealtimeNavBadgeKey = "jobs" | "analytics" | "api-config" | "users";

export const REALTIME_BADGE_NAV_HREFS: Record<RealtimeNavBadgeKey, string> = {
  jobs: "/jobs",
  analytics: "/analytics",
  "api-config": "/settings/api-config",
  users: "/users",
};

export function realtimeBadgeKeyForHref(href: string): RealtimeNavBadgeKey | null {
  if (href === "/jobs") return "jobs";
  if (href === "/analytics") return "analytics";
  if (href === "/settings/api-config") return "api-config";
  if (href === "/users") return "users";
  return null;
}

export function realtimeBadgeKeyForPathname(pathname: string): RealtimeNavBadgeKey | null {
  if (pathname === "/jobs" || pathname.startsWith("/jobs/")) return "jobs";
  if (pathname === "/analytics" || pathname.startsWith("/analytics/")) return "analytics";
  if (pathname === "/settings/api-config" || pathname.startsWith("/settings/api-config/")) {
    return "api-config";
  }
  if (pathname === "/users" || pathname.startsWith("/users/")) return "users";
  return null;
}

export function formatBadgeCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}
