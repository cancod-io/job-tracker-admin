import type { ReactNode } from "react";
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell";
import { AdminPanelAccessGate } from "@/components/admin/admin-panel-access-gate";
import { AdminRoute } from "@/components/admin/admin-route";
import { AdminPermissionsProvider } from "@/providers/admin-permissions-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRoute>
      <AdminPermissionsProvider>
        <AdminPanelAccessGate>
          <AdminDashboardShell>{children}</AdminDashboardShell>
        </AdminPanelAccessGate>
      </AdminPermissionsProvider>
    </AdminRoute>
  );
}
