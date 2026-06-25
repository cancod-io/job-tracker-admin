"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AnalyticsLineChart } from "@/components/admin/analytics/charts/analytics-line-chart";
import { AnalyticsChartTimeseriesSection } from "@/components/admin/analytics/analytics-chart-timeseries-section";
import { AnalyticsTimeseriesMeta } from "@/components/admin/analytics/analytics-timeseries-meta";
import { AnalyticsKpiCard, AnalyticsKpiGrid } from "@/components/admin/analytics/analytics-kpi-card";
import { AnalyticsPageHeader } from "@/components/admin/analytics/analytics-page-header";
import { AnalyticsPageState } from "@/components/admin/analytics/analytics-page-state";
import { AnalyticsSectionCard } from "@/components/admin/analytics/analytics-section-card";
import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";
import { getAnalyticsUserPipeline, getAnalyticsUsersTimeseries } from "@/lib/admin-analytics-api";
import { AnalyticsUserSummaryGrid } from "@/components/admin/analytics/analytics-user-summary-grid";
import {
  useAnalyticsUsersSummaryQuery,
  queryErrorMessage,
} from "@/hooks/use-analytics-queries";
import { buildUserSummaryQuadrants, formatAnalyticsNumber } from "@/lib/analytics-utils";
import { formatApplicantStatus } from "@/lib/applicant-status";
import { useAuth } from "@/providers/auth-provider";
import type { AnalyticsTimeseries, AnalyticsUserPipeline } from "@/types/admin-analytics-api";
import { formatDateTime } from "@/lib/format-date";

export function AnalyticsUsersPanel() {
  const { accessToken } = useAuth();
  const { apiParams, triggerRefresh } = useAnalyticsFilters();
  const [pipelineUserId, setPipelineUserId] = useState("");
  const [pipeline, setPipeline] = useState<AnalyticsUserPipeline | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const summaryQuery = useAnalyticsUsersSummaryQuery(apiParams);
  const summary = summaryQuery.data;

  const loadPipeline = useCallback(async () => {
    if (!accessToken || !pipelineUserId.trim()) return;
    const userId = Number(pipelineUserId);
    if (!Number.isFinite(userId) || userId <= 0) {
      setPipelineError("Enter a valid user ID.");
      return;
    }
    setPipelineError(null);
    try {
      setPipeline(await getAnalyticsUserPipeline(accessToken, userId, apiParams));
    } catch (e) {
      setPipeline(null);
      setPipelineError(e instanceof Error ? e.message : "Failed to load user pipeline.");
    }
  }, [accessToken, pipelineUserId, apiParams]);

  const quadrants = summary ? buildUserSummaryQuadrants(summary) : [];

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Users Analytics"
        subtitle="Role and approval breakdowns, registration trends, and per-user pipeline drill-down."
        onRefresh={triggerRefresh}
        refreshing={summaryQuery.isFetching}
      />
      <AnalyticsPageState
        loading={summaryQuery.isLoading}
        error={queryErrorMessage(summaryQuery.error)}
        empty={!summary}
      >
        {summary ? (
          <div className="space-y-4">
            <AnalyticsKpiGrid>
              <AnalyticsKpiCard label="Total users" value={formatAnalyticsNumber(summary.total_users)} />
            </AnalyticsKpiGrid>

            <AnalyticsChartTimeseriesSection
              title="Registrations Over Time"
              queryKey={["users", "timeseries"]}
              fetcher={(token, params) => getAnalyticsUsersTimeseries(token, params)}
              emptyMessage="No user trend data for this view."
              render={({ data, view }) => {
                const points =
                  (data as AnalyticsTimeseries).series[0]?.points.map((point) => ({
                    date: point.date,
                    value: point.count,
                  })) ?? [];
                if (points.length === 0) {
                  return (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No user trend data for this view.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    <AnalyticsTimeseriesMeta
                      view={view}
                      granularity={(data as AnalyticsTimeseries).granularity}
                      pointCount={points.length}
                    />
                    <AnalyticsLineChart points={points} label="Users" />
                  </div>
                );
              }}
            />

            <AnalyticsSectionCard title="User Summary">
              <AnalyticsUserSummaryGrid quadrants={quadrants} columns={4} />
            </AnalyticsSectionCard>

            <AnalyticsSectionCard
              title="User Pipeline Drill-down"
              subtitle="Enter a user ID to view status breakdown and recent applications."
            >
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm text-muted-foreground">
                  User ID
                  <input
                    type="number"
                    min={1}
                    value={pipelineUserId}
                    onChange={(e) => setPipelineUserId(e.target.value)}
                    className="ml-2 rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void loadPipeline()}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                >
                  Load pipeline
                </button>
                {pipelineUserId ? (
                  <Link
                    href={`/users?userId=${encodeURIComponent(pipelineUserId)}`}
                    className="text-sm font-medium text-primary underline"
                  >
                    Open user profile
                  </Link>
                ) : null}
              </div>
              {pipelineError ? (
                <p className="mt-3 text-sm text-destructive">{pipelineError}</p>
              ) : null}
              {pipeline ? (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Follow-ups due: {formatAnalyticsNumber(pipeline.follow_ups_due)}
                  </p>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status counts
                      </p>
                      <ul className="space-y-2">
                        {pipeline.status_counts.map((row) => (
                          <li key={row.key} className="flex justify-between text-sm">
                            <span>{row.label || formatApplicantStatus(row.key)}</span>
                            <span className="tabular-nums">{row.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Recent applications
                      </p>
                      <ul className="space-y-2">
                        {pipeline.recent_applications.map((app) => (
                          <li key={app.id} className="rounded-lg border border-border/70 p-2 text-sm">
                            <p className="font-medium">{app.job_title}</p>
                            <p className="text-muted-foreground">
                              {app.company} · {formatApplicantStatus(app.status)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(app.applied_at)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </AnalyticsSectionCard>
          </div>
        ) : null}
      </AnalyticsPageState>
    </div>
  );
}
