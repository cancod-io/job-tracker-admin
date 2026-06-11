import { Shield } from "lucide-react";
import { AdminRolePermissionsEditor } from "@/components/admin/admin-role-permissions-editor";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminPermissionsPage() {
  return (
    <RequirePermission permission="permissions.manage" title="Role Permissions">
      <div className="space-y-6">
        <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Role Permissions
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Configure what Moderator and User roles can do in the admin panel. Admin always has full
            access.
          </p>
        </header>
        <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="size-4 shrink-0 text-primary" aria-hidden />
            <span>Permission matrix</span>
          </div>
          <AdminRolePermissionsEditor />
        </div>
      </div>
    </RequirePermission>
  );
}
