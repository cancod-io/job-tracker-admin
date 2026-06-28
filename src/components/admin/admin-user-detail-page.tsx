"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminUserDetailPanel } from "@/components/admin/admin-user-detail-panel";
import { RequirePermission } from "@/components/admin/require-permission";

type AdminUserDetailPageProps = {
  userId: number;
};

export function AdminUserDetailPage({ userId }: AdminUserDetailPageProps) {
  const router = useRouter();

  return (
    <RequirePermission permission="users.read" title="User details">
      <div className="w-full space-y-4">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to users
        </Link>

        <AdminUserDetailPanel
          userId={userId}
          layout="page"
          onClose={() => router.push("/users")}
          onUpdated={() => {
            /* list refreshes via realtime events */
          }}
        />
      </div>
    </RequirePermission>
  );
}
