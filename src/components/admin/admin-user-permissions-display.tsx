"use client";

import { Check, Shield } from "lucide-react";
import {
  filterDisplayCatalog,
  filterDisplayPermissions,
  groupCatalogByCategory,
  isAdminRole,
  roleHasPermission,
} from "@/lib/admin-permissions";
import { roleLabel } from "@/lib/user-approval";
import { cn } from "@/lib/utils";
import type { AdminPermissionsResponse } from "@/types/admin-permissions-api";

type AdminUserPermissionsDisplayProps = {
  targetRole: string;
  matrix: AdminPermissionsResponse | null;
  loading?: boolean;
};

export function AdminUserPermissionsDisplay({
  targetRole,
  matrix,
  loading = false,
}: AdminUserPermissionsDisplayProps) {
  if (loading && !matrix) {
    return <p className="text-sm text-muted-foreground">Loading permissions…</p>;
  }

  if (!matrix || matrix.catalog.length === 0) {
    return <p className="text-sm text-muted-foreground">No permission data available.</p>;
  }

  const granted = filterDisplayPermissions(
    matrix.roles.find((r) => r.role === targetRole)?.permissions ?? [],
  );
  const displayCatalog = filterDisplayCatalog(matrix.catalog);
  const catalogKeys = displayCatalog.map((c) => c.key);
  const groups = groupCatalogByCategory(displayCatalog);
  const fullAccess = isAdminRole(targetRole);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Permissions assigned to the <span className="font-medium text-foreground">{roleLabel(targetRole)}</span> role
        {fullAccess ? " (full access)" : ""}.
      </p>
      {groups.map((group) => (
        <div key={group.category}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.category}
          </h4>
          <ul className="space-y-1.5">
            {group.items.map((item) => {
              const enabled = roleHasPermission(targetRole, granted, item.key, catalogKeys);
              return (
                <li
                  key={item.key}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                    enabled
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : "border-border/60 bg-muted/15 opacity-70",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                      enabled
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "border-border bg-muted text-transparent",
                    )}
                    aria-hidden
                  >
                    {enabled ? <Check className="size-3" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{item.label}</span>
                    {item.description ? (
                      <span className="block text-xs text-muted-foreground">{item.description}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {fullAccess ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="size-3.5 shrink-0 text-primary" aria-hidden />
          Admin role has full access to all permissions.
        </p>
      ) : null}
    </div>
  );
}
