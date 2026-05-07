import type { ReactNode } from "react";
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell";
import { AdminRoute } from "@/components/admin/admin-route";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRoute>
      <AdminDashboardShell>{children}</AdminDashboardShell>
    </AdminRoute>
  );
}
