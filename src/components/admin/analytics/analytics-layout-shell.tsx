"use client";

import { AnalyticsFilterProvider } from "@/components/admin/analytics/analytics-filter-context";

export function AnalyticsLayoutShell({ children }: { children: React.ReactNode }) {
  return <AnalyticsFilterProvider>{children}</AnalyticsFilterProvider>;
}
