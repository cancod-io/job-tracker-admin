import type { ReactNode } from "react";
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell";
import { AdminPanelAccessGate } from "@/components/admin/admin-panel-access-gate";
import { AdminRoute } from "@/components/admin/admin-route";
import { AnalyticsRealtimeSync } from "@/components/admin/analytics/analytics-realtime-sync";
import { AdminRealtimeNotificationsProvider } from "@/providers/admin-realtime-notifications-provider";
import { AdminPermissionsProvider } from "@/providers/admin-permissions-provider";
import { AdminRealtimeProvider } from "@/providers/admin-realtime-provider";
import { QueryProvider } from "@/providers/query-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRoute>
      <AdminPermissionsProvider>
        <AdminPanelAccessGate>
          <QueryProvider>
            <AdminRealtimeProvider>
              <AdminRealtimeNotificationsProvider>
                <AnalyticsRealtimeSync />
                <AdminDashboardShell>{children}</AdminDashboardShell>
              </AdminRealtimeNotificationsProvider>
            </AdminRealtimeProvider>
          </QueryProvider>
        </AdminPanelAccessGate>
      </AdminPermissionsProvider>
    </AdminRoute>
  );
}
