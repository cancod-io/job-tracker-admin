"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, X } from "lucide-react";
import { ADMIN_PENDING_APPROVAL_CHANGED_EVENT } from "@/lib/admin-sync-events";
import { apiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/http";
import { adminNavItems } from "@/config/admin-nav";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

type PendingUsersCountResponse = {
  total: number;
};

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname() ?? "/";
  const { accessToken } = useAuth();
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number | null>(null);

  const refreshPendingApprovalCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const q = new URLSearchParams({
        approval_status: "pending",
        page_size: "1",
      });
      const res = await fetchWithTimeout(apiUrl(`/api/v1/admin/users?${q}`), {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "omit",
      });
      if (!res.ok) return;
      const body = (await res.json()) as PendingUsersCountResponse;
      if (typeof body.total === "number") setPendingApprovalCount(body.total);
    } catch {
      /* leave prior count */
    }
  }, [accessToken]);

  useEffect(() => {
    void refreshPendingApprovalCount();
  }, [refreshPendingApprovalCount, pathname]);

  useEffect(() => {
    const onPendingChanged = () => void refreshPendingApprovalCount();
    window.addEventListener(ADMIN_PENDING_APPROVAL_CHANGED_EVENT, onPendingChanged);
    return () => window.removeEventListener(ADMIN_PENDING_APPROVAL_CHANGED_EVENT, onPendingChanged);
  }, [refreshPendingApprovalCount]);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
      <div className="mb-2 flex items-center justify-between px-1 md:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          onClick={onMobileClose}
          aria-label="Close navigation menu"
        >
          <X className="size-5" />
        </button>
      </div>
      <ul className="space-y-0.5">
        {adminNavItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname === ""
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const showPendingBadge =
            item.href === "/users" && pendingApprovalCount != null && pendingApprovalCount > 0;
          const badgeText =
            pendingApprovalCount != null && pendingApprovalCount > 99 ? "99+" : pendingApprovalCount;

          return (
            <li key={item.href}>
              <Link
                href={item.href as "/"}
                className={linkClass(active)}
                onClick={onMobileClose}
                aria-current={active ? "page" : undefined}
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </span>
                {showPendingBadge ? (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums",
                      active
                        ? "bg-primary-foreground/25 text-primary-foreground"
                        : "bg-amber-600 text-white shadow-sm dark:bg-amber-500 dark:text-amber-950",
                    )}
                    aria-label={`${pendingApprovalCount} waiting for approval`}
                  >
                    {badgeText}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={onMobileClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(17rem,88vw)] flex-col border-r border-border/80 bg-card shadow-lg transition-transform duration-200 ease-out motion-reduce:transition-none md:static md:z-0 md:w-56 md:translate-x-0 md:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Admin sidebar"
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/80 px-4 md:h-16">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PanelLeftClose className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Job Tracker</p>
            <p className="truncate text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
        {nav}
      </aside>
    </>
  );
}
