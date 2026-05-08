import { Users } from "lucide-react";
import { AdminUserApprovalQueue } from "@/components/admin/admin-user-approval-queue";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Users</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review new registrations and set approval status. Only approved users can sign in and use
          the API.
        </p>
      </header>
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Approval queue and user directory</span>
        </div>
        <AdminUserApprovalQueue />
      </div>
    </div>
  );
}
