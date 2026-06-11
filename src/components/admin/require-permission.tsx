"use client";

import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { isAdminRole } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";

type RequirePermissionProps = {
  permission: string;
  title?: string;
  children: ReactNode;
};

export function RequirePermission({ permission, title, children }: RequirePermissionProps) {
  const { user } = useAuth();
  const { can, loading } = useAdminPermissions();
  const allowed = can(permission);

  if (loading && !isAdminRole(user?.role)) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground"
        aria-busy="true"
        aria-label="Loading permissions"
      >
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
          <ShieldOff className="size-6" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-foreground">
          {title ? `No access to ${title}` : "Access denied"}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          You do not have the <code className="text-xs">{permission}</code> permission required for
          this page. Contact an administrator if you need access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
