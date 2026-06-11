"use client";

import { useEffect, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

type AdminRouteProps = {
  children: ReactNode;
};

/**
 * Client guard for dashboard routes. Redirects to `/login` when unauthenticated.
 * Wrap segment layouts or pages that require an admin session.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    const dest = `/login${next}`;
    router.replace(dest);
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          You need to sign in to open the admin console.
        </p>
        <Link
          href={`/login${next}`}
          className="hover:bg-primary/92 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * HOC for protecting client page components (optional; prefer wrapping in layout).
 */
export function withAdminRoute<P extends object>(Component: ComponentType<P>) {
  function Wrapped(props: P) {
    return (
      <AdminRoute>
        <Component {...props} />
      </AdminRoute>
    );
  }
  Wrapped.displayName = `withAdminRoute(${Component.displayName ?? Component.name ?? "Component"})`;
  return Wrapped;
}
