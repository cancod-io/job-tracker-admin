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
  const { status, user } = useAuth();
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
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          This console is restricted to administrator accounts. You are signed in as{" "}
          <span className="font-medium text-foreground">{user.email}</span> with role{" "}
          <span className="font-medium text-foreground">{user.role}</span>.
        </p>
        <Link
          href={process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000"}
          className="hover:bg-primary/92 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors"
        >
          Open main app
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
