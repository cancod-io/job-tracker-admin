"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ShieldCheck, X } from "lucide-react";
import {
  getVisibleNavGroups,
  isNavGroupActive,
  isNavItemActive,
} from "@/lib/admin-access";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAdminRealtimeNotifications } from "@/providers/admin-realtime-notifications-provider";
import { formatBadgeCount } from "@/lib/admin-realtime-badges";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

type NavCountBadgeProps = {
  count: number;
  active: boolean;
  ariaLabel: string;
};

function NavCountBadge({ count, active, ariaLabel }: NavCountBadgeProps) {
  return (
    <span
      className={cn(
        "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums",
        active
          ? "bg-primary-foreground/25 text-primary-foreground"
          : "bg-amber-600 text-white shadow-sm dark:bg-amber-500 dark:text-amber-950",
      )}
      aria-label={ariaLabel}
    >
      {formatBadgeCount(count)}
    </span>
  );
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname() ?? "/";
  const { can, isAdmin, loading: permissionsLoading } = useAdminPermissions();

  const visibleNavGroups = useMemo(() => {
    if (permissionsLoading) return [];
    return getVisibleNavGroups(can, { isAdmin });
  }, [permissionsLoading, can, isAdmin]);

  const [openGroupIds, setOpenGroupIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroupIds((prev) => {
      const next = { ...prev };
      for (const group of visibleNavGroups) {
        if (isNavGroupActive(pathname, group)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [pathname, visibleNavGroups]);

  const { getBadgeCountForHref } = useAdminRealtimeNotifications();

  const linkClass = (active: boolean) =>
    cn(
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none",
      active
        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
    );

  const groupButtonClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 motion-reduce:transition-none",
      active
        ? "bg-muted text-foreground"
        : "text-foreground/90 hover:bg-muted/80 hover:text-foreground",
    );

  function toggleGroup(groupId: string) {
    setOpenGroupIds((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }

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

      {permissionsLoading ? (
        <ul className="space-y-2 px-1" aria-busy="true" aria-label="Loading menu">
          {[0, 1, 2].map((key) => (
            <li key={key} className="h-10 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </ul>
      ) : visibleNavGroups.length === 0 ? (
        <p className="px-2 py-3 text-xs text-muted-foreground">
          No pages available for your role. Ask an administrator to assign permissions.
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleNavGroups.map((group) => {
            const groupActive = isNavGroupActive(pathname, group);
            const isOpen = openGroupIds[group.id] ?? groupActive;
            const GroupIcon = group.icon;
            const groupBadgeCount = group.children.reduce(
              (sum, item) => sum + getBadgeCountForHref(item.href),
              0,
            );

            return (
              <li key={group.id}>
                <button
                  type="button"
                  className={groupButtonClass(groupActive)}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  aria-controls={`nav-group-${group.id}`}
                >
                  <GroupIcon className="size-4 shrink-0 opacity-90" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
                  {groupBadgeCount > 0 && !isOpen ? (
                    <NavCountBadge
                      count={groupBadgeCount}
                      active={false}
                      ariaLabel={`${groupBadgeCount} updates`}
                    />
                  ) : null}
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen ? (
                  <ul id={`nav-group-${group.id}`} className="mt-1 space-y-0.5 border-l border-border/70 ml-4 pl-2">
                    {group.children.map((item) => {
                      const active = isNavItemActive(pathname, item.href);
                      const Icon = item.icon;
                      const badgeCount = getBadgeCountForHref(item.href);
                      const showBadge = badgeCount > 0;
                      const badgeAriaLabel =
                        item.href === "/users"
                          ? `${badgeCount} waiting for approval`
                          : `${badgeCount} new updates`;

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
                            {showBadge ? (
                              <NavCountBadge
                                count={badgeCount}
                                active={active}
                                ariaLabel={badgeAriaLabel}
                              />
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
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
              <Image
                src="/light-logo.png"
                alt="TrackCod"
                width={220}
                height={56}
                priority
                className="h-auto w-auto max-h-10 object-contain object-left dark:hidden"
              />
              <Image
                src="/dark-logo.png"
                alt="TrackCod"
                width={220}
                height={56}
                priority
                className="hidden h-auto w-auto max-h-10 object-contain object-left dark:block"
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
