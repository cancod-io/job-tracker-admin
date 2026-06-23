import { Shield } from "lucide-react";
import { AdminRolePermissionsEditor } from "@/components/admin/admin-role-permissions-editor";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminPermissionsPage() {
  return (
    <RequirePermission permission="permissions.manage" title="Role Permissions">
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Permission matrix</span>
        </div>
        <AdminRolePermissionsEditor />
      </div>
    </RequirePermission>
  );
}
