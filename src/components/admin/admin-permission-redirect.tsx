"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getFirstAllowedRoute,
  hasAnyNavAccess,
  isAdminOnlyPath,
  permissionForPath,
} from "@/lib/admin-access";
import { isAdminRole } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";

/**
 * Redirects users away from pages they cannot access and sends `/` to the first allowed route.
 */
export function AdminPermissionRedirect() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { user } = useAuth();
  const { can, loading, isAdmin } = useAdminPermissions();

  useEffect(() => {
    if (!user || loading) return;
    if (isAdmin) return;

    const navOpts = { isAdmin };
    const required = permissionForPath(pathname);
    const home = pathname === "/" || pathname === "";

    if (home) {
      const first = getFirstAllowedRoute(can, navOpts);
      if (first && first !== "/") {
        router.replace(first);
      }
      return;
    }

    if (isAdminOnlyPath(pathname) && !isAdminRole(user.role)) {
      const first = getFirstAllowedRoute(can, navOpts);
      if (first) router.replace(first);
      else if (!hasAnyNavAccess(can, navOpts)) router.replace("/");
      return;
    }

    if (required && !can(required)) {
      const first = getFirstAllowedRoute(can, navOpts);
      if (first) router.replace(first);
      else if (!hasAnyNavAccess(can, navOpts)) router.replace("/");
    }
  }, [user, loading, isAdmin, pathname, can, router]);

  return null;
}
