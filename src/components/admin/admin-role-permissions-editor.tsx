"use client";

import { useState } from "react";
import { Check, Loader2, RefreshCw, Shield, UserCog, UserRound } from "lucide-react";
import { AdminRolePermissionsChecklist } from "@/components/admin/admin-role-permissions-checklist";
import { updateRolePermissions } from "@/lib/admin-permissions-api";
import {
  filterDisplayCatalog,
  filterDisplayPermissions,
  isAdminRole,
} from "@/lib/admin-permissions";
import { roleLabel } from "@/lib/user-approval";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

const ROLE_CARDS: {
  role: UserRole;
  icon: typeof Shield;
  tile: string;
  ring: string;
}[] = [
  {
    role: "admin",
    icon: Shield,
    tile: "bg-primary/15 text-primary",
    ring: "border-primary ring-2 ring-primary/20",
  },
  {
    role: "moderator",
    icon: UserCog,
    tile: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    ring: "border-violet-500 ring-2 ring-violet-500/20",
  },
  {
    role: "user",
    icon: UserRound,
    tile: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    ring: "border-emerald-500 ring-2 ring-emerald-500/20",
  },
];

export function AdminRolePermissionsEditor() {
  const { accessToken } = useAuth();
  const { matrix, loading, error, can, refetch } = useAdminPermissions();
  const [activeRole, setActiveRole] = useState<UserRole>("moderator");

  const canManage = can("permissions.manage");
  const viewingAdmin = isAdminRole(activeRole);

  const totalCount = matrix ? filterDisplayCatalog(matrix.catalog).length : 0;
  const grantedCountFor = (role: UserRole): number => {
    if (isAdminRole(role)) return totalCount;
    const entry = matrix?.roles.find((r) => r.role === role);
    return filterDisplayPermissions(entry?.permissions ?? []).length;
  };

  const handleSave = async (permissions: string[]) => {
    if (!accessToken || !canManage || viewingAdmin) return;
    await updateRolePermissions(accessToken, activeRole as Exclude<UserRole, "admin">, {
      permissions,
    });
    await refetch();
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-6 text-sm text-amber-950 dark:text-amber-100">
        You do not have permission to manage role permissions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="grid w-full gap-3 sm:flex-1 sm:grid-cols-3"
          role="tablist"
          aria-label="Select role to edit"
        >
          {ROLE_CARDS.map(({ role, icon: Icon, tile, ring }) => {
            const selected = activeRole === role;
            const admin = isAdminRole(role);
            return (
              <button
                key={role}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveRole(role)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl border bg-card p-3.5 text-left transition-all",
                  selected
                    ? ring
                    : "border-border/70 hover:border-border hover:bg-muted/30",
                )}
              >
                <span
                  className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tile)}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {roleLabel(role)}
                  </span>
                  <span className="block text-xs tabular-nums text-muted-foreground">
                    {admin ? "Full access" : `${grantedCountFor(role)} of ${totalCount} permissions`}
                  </span>
                </span>
                {selected ? (
                  <Check className="size-4 shrink-0 text-primary" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
          Refresh
        </button>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading && !matrix ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-hidden />
          Loading permission matrix…
        </div>
      ) : (
        <AdminRolePermissionsChecklist
          targetRole={activeRole}
          matrix={matrix}
          loading={loading}
          editable={canManage && !viewingAdmin}
          onSave={viewingAdmin ? undefined : handleSave}
        />
      )}

      <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <Shield className="size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong>Admin</strong> always has full access and cannot be changed via the API. Grant
            similar access to Moderator or User with <strong>Select all</strong>, or set an
            individual user&apos;s role to Admin in their profile.
          </span>
        </p>
      </div>
    </div>
  );
}
