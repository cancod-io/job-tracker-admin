"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, X } from "lucide-react";
import { adminNavItems } from "@/config/admin-nav";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname() ?? "/";

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
          return (
            <li key={item.href}>
              <Link
                href={item.href as "/"}
                className={linkClass(active)}
                onClick={onMobileClose}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
                {item.label}
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
