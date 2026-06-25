"use client";

import { useState } from "react";
import { AnalyticsPageHeader } from "@/components/admin/analytics/analytics-page-header";
import { AnalyticsPageState } from "@/components/admin/analytics/analytics-page-state";
import { AnalyticsSectionCard } from "@/components/admin/analytics/analytics-section-card";
import { AnalyticsScraperRunsPanel } from "@/components/admin/analytics/analytics-scraper-runs-panel";
import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";
import {
  useAnalyticsCeleryStatusQuery,
  useAnalyticsIngestHealthQuery,
  useAnalyticsNotificationsSummaryQuery,
  useAnalyticsScraperLogsQuery,
  queryErrorMessage,
} from "@/hooks/use-analytics-queries";
import { formatAnalyticsNumber, formatAnalyticsPercent } from "@/lib/analytics-utils";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

type WorkersTab = "runs" | "ingest" | "workers";

const TABS: { id: WorkersTab; label: string }[] = [
  { id: "runs", label: "Scraper Runs" },
  { id: "ingest", label: "Ingest Health" },
  { id: "workers", label: "Workers" },
];

export function AnalyticsWorkersPanel() {
  const [tab, setTab] = useState<WorkersTab>("runs");

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Scraping & Workers"
        subtitle="Operational visibility into scraper runs, ingest health, Celery queues, and worker logs."
        showCompare={false}
      />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/50 p-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "runs" ? <AnalyticsScraperRunsPanel embedded /> : null}
      {tab === "ingest" ? <IngestHealthTab /> : null}
      {tab === "workers" ? <WorkersTabPanel /> : null}
    </div>
  );
}

function IngestHealthTab() {
  const { apiParams } = useAnalyticsFilters();
  const healthQuery = useAnalyticsIngestHealthQuery(apiParams);
  const notificationsQuery = useAnalyticsNotificationsSummaryQuery(apiParams);

  const health = healthQuery.data ?? null;
  const notifications = notificationsQuery.data ?? null;
  const loading = healthQuery.isLoading && notificationsQuery.isLoading;
  const error =
    queryErrorMessage(healthQuery.error) ?? queryErrorMessage(notificationsQuery.error);

  return (
    <AnalyticsPageState loading={loading} error={error} empty={!health && !notifications}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {health ? (
          <AnalyticsSectionCard
            title="Ingest Health"
            subtitle={`Last ${health.window_hours}h · ${formatAnalyticsNumber(health.total_batches)} batches`}
          >
            <ul className="space-y-3 text-sm">
              <MetricRow label="Created rate" value={formatAnalyticsPercent(health.created_rate, true)} />
              <MetricRow label="Updated rate" value={formatAnalyticsPercent(health.updated_rate, true)} />
              <MetricRow label="Blocked rate" value={formatAnalyticsPercent(health.blocked_rate, true)} />
              <MetricRow label="Failed rate" value={formatAnalyticsPercent(health.failed_rate, true)} />
            </ul>
          </AnalyticsSectionCard>
        ) : null}
        {notifications ? (
          <AnalyticsSectionCard title="Email Digests">
            <ul className="space-y-3 text-sm">
              <MetricRow label="Sent" value={formatAnalyticsNumber(notifications.digests_sent)} />
              <MetricRow label="Pending" value={formatAnalyticsNumber(notifications.digests_pending)} />
              <MetricRow
                label="Last sent"
                value={
                  notifications.last_sent_at
                    ? formatDateTime(notifications.last_sent_at)
                    : "—"
                }
              />
            </ul>
          </AnalyticsSectionCard>
        ) : null}
      </div>
    </AnalyticsPageState>
  );
}

function WorkersTabPanel() {
  const celeryQuery = useAnalyticsCeleryStatusQuery();
  const logsQuery = useAnalyticsScraperLogsQuery({ limit: 20 });

  const celery = celeryQuery.data ?? null;
  const logs = logsQuery.data ?? null;
  const loading = celeryQuery.isLoading && logsQuery.isLoading;
  const error = queryErrorMessage(celeryQuery.error) ?? queryErrorMessage(logsQuery.error);

  return (
    <AnalyticsPageState loading={loading} error={error} empty={!celery && !logs}>
      <div className="space-y-4">
        {celery ? (
          <AnalyticsSectionCard title="Celery Status">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <MetricTile label="Workers online" value={formatAnalyticsNumber(celery.workers_online)} />
              <MetricTile label="Active tasks" value={formatAnalyticsNumber(celery.active_tasks)} />
              <MetricTile
                label="Failed (24h)"
                value={formatAnalyticsNumber(celery.failed_tasks_24h)}
              />
              <MetricTile
                label="Last beat"
                value={celery.last_beat_at ? formatDateTime(celery.last_beat_at) : "—"}
              />
            </div>
            {celery.queues.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {celery.queues.map((queue) => (
                  <li key={queue.name} className="flex justify-between">
                    <span>{queue.name}</span>
                    <span className="tabular-nums">{queue.depth}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </AnalyticsSectionCard>
        ) : null}

        {logs?.items.length ? (
          <AnalyticsSectionCard title="Scraper Logs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Duration</th>
                    <th className="py-2 pr-3 font-medium">Started</th>
                    <th className="py-2 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.items.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 last:border-b-0">
                      <td className="py-2.5 pr-3 font-medium">{log.name}</td>
                      <td className="py-2.5 pr-3">{log.status}</td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {log.duration_ms != null ? `${log.duration_ms}ms` : "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {formatDateTime(log.started_at)}
                      </td>
                      <td className="max-w-[14rem] truncate py-2.5 text-destructive">
                        {log.error_message ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnalyticsSectionCard>
        ) : null}
      </div>
    </AnalyticsPageState>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </li>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
