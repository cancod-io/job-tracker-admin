"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { AdminNoAccessState } from "@/components/admin/admin-no-access-state";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import type { ReactNode } from "react";

type AdminPanelAccessGateProps = {
  children: ReactNode;
};

/**
 * Gates the whole admin console on the signed-in user's effective permissions
 * (GET /api/admin/permissions/me). Admins always enter; every other role needs at
 * least one granted permission. A load failure fails closed with a retry.
 */
export function AdminPanelAccessGate({ children }: AdminPanelAccessGateProps) {
  const { user, logout } = useAuth();
  const { loading, error, isAdmin, myPermissions, refetch } = useAdminPermissions();
  const router = useRouter();

  if (!user) return null;

  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground"
        aria-busy="true"
        aria-label="Loading permissions"
      >
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm">Checking your access…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-sm text-destructive" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="size-4" aria-hidden />
          Retry
        </button>
      </div>
    );
  }

  if (isAdmin || myPermissions.length > 0) {
    return <>{children}</>;
  }

  function goToAuth(path: "/login" | "/register") {
    logout();
    router.replace(path);
  }

  return (
    <>
      <Modal
        aria-label="Admin access required"
        title="Admin access required"
        description="Your account does not have permission to use the admin console."
        onClose={() => goToAuth("/login")}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are signed in as <span className="font-medium text-foreground">{user.email}</span>{" "}
            with role <span className="font-medium text-foreground">{user.role}</span>. Ask an
            administrator to assign permissions to your account.
          </p>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => goToAuth("/login")}
              className="hover:bg-primary/92 inline-flex h-10 min-w-[10rem] items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors"
            >
              Back to sign in
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Looking for the public job board?{" "}
            <Link
              href={process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000"}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Open main app
            </Link>
          </p>
        </div>
      </Modal>
      <AdminNoAccessState />
    </>
  );
}
