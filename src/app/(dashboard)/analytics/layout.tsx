import { AnalyticsLayoutShell } from "@/components/admin/analytics/analytics-layout-shell";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AnalyticsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequirePermission permission="stats.read" title="Analytics">
      <AnalyticsLayoutShell>{children}</AnalyticsLayoutShell>
    </RequirePermission>
  );
}
