"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Menu, UserRound } from "lucide-react";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

type AdminTopBarProps = {
  onMenuClick: () => void;
};

export function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <header
      className="sticky top-0 z-30 shrink-0 border-b border-border/80 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
      role="banner"
    >
      <div className="flex h-14 items-center gap-3 px-3 md:h-16 md:px-5">
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card/90 text-foreground shadow-sm transition-colors hover:bg-muted md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0 flex-1 md:flex md:items-center md:gap-4">
          <p className="truncate text-sm font-semibold text-foreground md:hidden">Admin</p>
          <AdminBreadcrumbs className="hidden min-w-0 flex-1 overflow-x-auto md:block" />
        </div>

        <ThemeToggle />

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            className={cn(
              "inline-flex max-w-[12rem] items-center gap-2 rounded-xl border border-border bg-card/90 px-2.5 py-2 text-left text-sm shadow-sm transition-colors hover:bg-muted md:max-w-xs",
              menuOpen && "bg-muted",
            )}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-4" aria-hidden />
            </span>
            <span className="hidden min-w-0 flex-1 flex-col leading-tight sm:flex">
              <span className="truncate font-medium text-foreground">
                {user?.full_name ?? "Admin"}
              </span>
              <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
            </span>
          </button>

          {menuOpen ? (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card py-1 shadow-xl"
              role="menu"
              aria-orientation="vertical"
            >
              <div className="border-b border-border px-3 py-2 sm:hidden">
                <p className="truncate text-sm font-medium text-foreground">{user?.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <LogOut className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border/60 px-3 py-2 md:hidden">
        <AdminBreadcrumbs className="overflow-x-auto whitespace-nowrap" />
      </div>
    </header>
  );
}
