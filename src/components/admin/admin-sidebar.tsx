"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";
import { ADMIN_PENDING_APPROVAL_CHANGED_EVENT } from "@/lib/admin-sync-events";
import { fetchAuthedJson } from "@/lib/fetch-authed";
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
      const body = await fetchAuthedJson<PendingUsersCountResponse>(
        accessToken,
        `/api/v1/admin/users?${q}`,
      );
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
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none",
      active
        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
    );

  const nav = (
    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Admin">
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
      <ul className="space-y-1">
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
                  <Icon
                    className={cn(
                      "size-4 shrink-0 opacity-90 transition-transform duration-200",
                      !active && "group-hover:scale-105",
                    )}
                    aria-hidden
                  />
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
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[min(17.5rem,88vw)] flex-col overflow-hidden border-r border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out motion-reduce:transition-none md:w-64 md:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Admin sidebar"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/80 px-4">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5" onClick={onMobileClose}>
            <span className="relative flex min-w-0 items-center">
              <img
                src="/light-logo.png"
                alt="TrackCod"
                width={220}
                height={56}
                className="w-auto object-contain object-left dark:hidden"
              />
              <img
                src="/dark-logo.png"
                alt="TrackCod"
                width={220}
                height={56}
                className="hidden w-auto object-contain object-left dark:block"
              />
            </span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
            <ShieldCheck className="size-3.5" aria-hidden />
            Admin
          </span>
        </div>
        {nav}
      </aside>
    </>
  );
}
