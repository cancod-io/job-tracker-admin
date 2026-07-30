"use client";

import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { isAdminRole } from "@/lib/admin-permissions";
import { useAuth } from "@/providers/auth-provider";

type RequireAdminProps = {
  title?: string;
  children: ReactNode;
};

/**
 * Gates a page to administrators only (`role === "admin"`).
 * Backend vault endpoints use `require_roles(ADMIN)`; moderators receive 403.
 */
export function RequireAdmin({ title, children }: RequireAdminProps) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground"
        aria-busy="true"
        aria-label="Loading session"
      >
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (!isAdminRole(user?.role)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
          <ShieldOff className="size-6" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-foreground">
          {title ? `No access to ${title}` : "Access denied"}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Only administrators can manage credentials.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
