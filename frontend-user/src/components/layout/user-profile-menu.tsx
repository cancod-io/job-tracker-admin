"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted";

export function UserProfileMenu() {
  const { status, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (status === "loading") {
    return (
      <div
        className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
        aria-hidden
      />
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/register"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Register
        </Link>
        <Link
          href="/login"
          className="hover:bg-primary/92 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const letter = initials(user.full_name, user.email);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex max-w-full items-center gap-2 rounded-lg border border-border bg-card py-1.5 pl-1.5 pr-2 text-left shadow-sm transition-colors hover:bg-muted/80",
          open && "bg-muted/80",
        )}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary"
          aria-hidden
        >
          {letter}
        </span>
        <span className="hidden min-w-0 flex-1 flex-col leading-tight sm:flex">
          <span className="truncate text-sm font-medium text-foreground">{user.full_name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card py-1 shadow-lg"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="border-b border-border px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-medium">{user.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Account
          </p>
          <button
            type="button"
            role="menuitem"
            className={cn(menuItemClass, "text-muted-foreground")}
            disabled
          >
            <UserRound className="size-4" aria-hidden />
            Profile
            <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              Soon
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={cn(menuItemClass, "text-muted-foreground")}
            disabled
          >
            <Settings className="size-4" aria-hidden />
            Settings
            <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              Soon
            </span>
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut className="size-4 text-muted-foreground" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
