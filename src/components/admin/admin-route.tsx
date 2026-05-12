"use client";

import { useEffect, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";

type AdminRouteProps = {
  children: ReactNode;
};

/**
 * Client guard for dashboard routes. Redirects to `/login` when unauthenticated.
 * Wrap segment layouts or pages that require an admin session.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { status, user, logout } = useAuth();
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
        className="flex min-h-[50vh] flex-col gap-4 p-6 md:p-8"
        aria-busy="true"
        aria-label="Loading"
      >
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-32 w-full max-w-2xl" />
        <Skeleton className="h-24 w-full max-w-xl" />
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

  if (user && user.role !== "admin") {
    function goToAuth(path: "/login" | "/register") {
      logout();
      router.replace(path);
    }

    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          This console is restricted to administrator accounts. You are signed in as{" "}
          <span className="font-medium text-foreground">{user.email}</span> with role{" "}
          <span className="font-medium text-foreground">{user.role}</span>.
        </p>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => goToAuth("/login")}
            className="hover:bg-primary/92 inline-flex h-10 min-w-[10rem] items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors"
          >
            Back to sign in
          </button>
          <button
            type="button"
            onClick={() => goToAuth("/register")}
            className="inline-flex h-10 min-w-[10rem] items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            Register
          </button>
        </div>
        <p className="max-w-md pt-2 text-xs text-muted-foreground">
          Looking for the public job board?{" "}
          <a
            href={process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000"}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Open main app
          </a>
        </p>
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
