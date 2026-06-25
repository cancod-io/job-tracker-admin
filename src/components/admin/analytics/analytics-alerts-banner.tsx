"use client";

import Link from "next/link";
import { AlertTriangle, Info, XCircle } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { useAnalyticsAlertsQuery } from "@/hooks/use-analytics-queries";
import type { AnalyticsAlert } from "@/types/admin-analytics-api";
import { cn } from "@/lib/utils";

function AlertIcon({ severity }: { severity: AnalyticsAlert["severity"] }) {
  if (severity === "error") return <XCircle className="size-4 shrink-0" aria-hidden />;
  if (severity === "warning") return <AlertTriangle className="size-4 shrink-0" aria-hidden />;
  return <Info className="size-4 shrink-0" aria-hidden />;
}

export function AnalyticsAlertsBanner() {
  const alertsQuery = useAnalyticsAlertsQuery();
  const alerts = alertsQuery.data?.alerts ?? [];

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <AlertBanner
          key={alert.id}
          variant={alert.severity === "error" ? "error" : "warning"}
          className={cn("flex items-start gap-2")}
        >
          <AlertIcon severity={alert.severity} />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{alert.title}</p>
            <p className="text-sm opacity-90">{alert.message}</p>
            {alert.href ? (
              <Link href={alert.href} className="mt-1 inline-block text-sm font-medium underline">
                View details
              </Link>
            ) : null}
          </div>
        </AlertBanner>
      ))}
    </div>
  );
}
