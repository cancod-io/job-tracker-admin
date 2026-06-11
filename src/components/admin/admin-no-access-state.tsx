"use client";

import { ShieldOff } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { roleLabel } from "@/lib/user-approval";

type AdminNoAccessStateProps = {
  title?: string;
  description?: string;
};

export function AdminNoAccessState({
  title = "No access configured",
  description = "Your account does not have permission to view any admin pages yet.",
}: AdminNoAccessStateProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200">
        <ShieldOff className="size-7" aria-hidden />
      </span>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {user ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span> (
          {roleLabel(user.role)}). Ask an administrator to assign permissions to your role.
        </p>
      ) : null}
    </div>
  );
}
