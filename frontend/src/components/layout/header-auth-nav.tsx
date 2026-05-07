"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

const btnClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

export function HeaderAuthNav() {
  const { status, user, logout } = useAuth();

  if (status === "loading") {
    return <span className="px-2 text-xs tabular-nums text-muted-foreground">…</span>;
  }

  if (status === "authenticated" && user) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="hidden max-w-[10rem] truncate text-xs text-muted-foreground sm:inline">
          {user.email}
        </span>
        <button type="button" className={btnClass} onClick={() => logout()}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <Link href="/register" className={btnClass}>
        Register
      </Link>
      <Link href="/login" className={btnClass}>
        Sign in
      </Link>
    </div>
  );
}
