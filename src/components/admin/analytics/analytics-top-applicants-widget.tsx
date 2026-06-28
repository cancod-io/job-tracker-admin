"use client";

import Link from "next/link";
import { ApplicantAvatar } from "@/components/admin/applicant-avatar";
import { AnalyticsSectionCard } from "@/components/admin/analytics/analytics-section-card";
import { useTopApplicantsRealtime } from "@/hooks/use-top-applicants-realtime";
import { formatAnalyticsNumber } from "@/lib/analytics-utils";

export function AnalyticsTopApplicantsWidget() {
  const payload = useTopApplicantsRealtime();
  const applicants = payload?.applicants ?? [];

  return (
    <AnalyticsSectionCard
      title="Top Applicants"
      subtitle={
        payload
          ? `${formatAnalyticsNumber(payload.applications_today_total)} applications today (UTC)`
          : "Live updates via WebSocket"
      }
      action={
        <Link href="/users" className="text-sm font-medium text-primary hover:underline">
          View all users →
        </Link>
      }
    >
      {applicants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-2 font-medium">User</th>
                <th className="py-2 pr-2 text-right font-medium">Total</th>
                <th className="py-2 text-right font-medium">Today</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((row) => (
                <tr key={row.user_id} className="border-b border-border/50 last:border-b-0">
                  <td className="py-2 pr-2">
                    <Link
                      href={`/users/${row.user_id}`}
                      className="flex min-w-0 items-center gap-2 rounded-md transition-colors hover:text-primary"
                    >
                      <ApplicantAvatar
                        userId={row.user_id}
                        name={row.full_name || row.email}
                        profilePictureUrl={null}
                        sizeClass="size-8"
                        textClass="text-[10px]"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {row.full_name || row.email}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {row.email}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">
                    {formatAnalyticsNumber(row.application_count)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {row.applications_today > 0 ? (
                      <span className="font-medium text-primary">
                        {formatAnalyticsNumber(row.applications_today)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {formatAnalyticsNumber(row.applications_today)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Waiting for applicant stats…
        </p>
      )}
    </AnalyticsSectionCard>
  );
}
