import { Users } from "lucide-react";
import { AdminUserApprovalQueue } from "@/components/admin/admin-user-approval-queue";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminUsersPage() {
  return (
    <RequirePermission permission="users.read" title="Users">
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Approval queue and user directory</span>
        </div>
        <AdminUserApprovalQueue />
      </div>
    </RequirePermission>
  );
}
