"use client";

import { useCallback, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { formatShortDateTime, formatTime, formatUptime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import {
  useMonitorStatus,
  type MonitorFetchTrigger,
} from "@/hooks/use-monitor-status";
import type { MonitorStatus } from "@/types/scraper-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LogTrigger = Exclude<MonitorFetchTrigger, "initial">;

type LogEntry = {
  id: string;
  ts: Date;
  status: MonitorStatus;
  trigger: LogTrigger;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usagePct(used: number, total: number) {
  return total > 0 ? Math.min(100, (used / total) * 100) : 0;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
      ok
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : "border-destructive/30 bg-destructive/10 text-destructive",
    )}>
      {ok ? <CheckCircle2 className="size-3 shrink-0" /> : <AlertCircle className="size-3 shrink-0" />}
      {label}
    </span>
  );
}

function UsageBar({ used, total, color = "bg-primary" }: { used: number; total: number; color?: string }) {
  const pct = usagePct(used, total);
  const danger = pct > 80;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar"
      aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn("h-full rounded-full transition-all", danger ? "bg-amber-500" : color)}
        style={{ width: `${pct.toFixed(1)}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const MAX_LOG_ENTRIES = 50;

export function ScraperLogsMonitor() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [polling, setPolling] = useState(true);
  const [probeLoading, setProbeLoading] = useState(false);

  const handleSuccess = useCallback(
    (status: MonitorStatus, trigger: MonitorFetchTrigger) => {
      const logTrigger: LogTrigger =
        trigger === "initial" ? "manual" : (trigger as LogTrigger);
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ts: new Date(),
        status,
        trigger: logTrigger,
      };
      setLog((prev) => [entry, ...prev].slice(0, MAX_LOG_ENTRIES));
    },
    [],
  );

  const {
    status: current,
    loading,
    error,
    lastFetched,
    refetch,
  } = useMonitorStatus({
    live: true,
    intervalMs: 30_000,
    pollingEnabled: polling,
    onSuccess: handleSuccess,
  });

  const probeRapidApi = async () => {
    setProbeLoading(true);
    try {
      await refetch({ rapidapiProbe: true });
    } finally {
      setProbeLoading(false);
    }
  };

  const busy = current?.busy === true;
  const online = !error && current !== null;
  const serpapi = current?.serpapi;
  const rapidapi = current?.rapidapi;
  const serpAccount = serpapi?.account;
  const rapidQuota = rapidapi?.quota?.plan;

  return (
    <div className="space-y-6">

      {/* ── Control bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex size-2.5 rounded-full ring-2",
            online
              ? "bg-emerald-500 ring-emerald-500/25 animate-pulse"
              : error
                ? "bg-destructive ring-destructive/25"
                : "bg-muted-foreground/40 ring-muted-foreground/20"
          )} />
          <span className="text-sm font-medium text-foreground">
            {online ? "Service online" : error ? "Service offline" : "Connecting…"}
          </span>
          {lastFetched && (
            <span className="text-xs text-muted-foreground">
              · last checked {formatTime(lastFetched)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Polling toggle */}
          <button
            type="button"
            onClick={() => setPolling((p) => !p)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              polling
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                : "border-border/80 bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {polling ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
            {polling ? "Live (30s)" : "Paused"}
          </button>

          {/* Manual refresh */}
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={loading || probeLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden />
            Refresh
          </button>

          {/* Clear log */}
          <button
            type="button"
            onClick={() => setLog([])}
            disabled={log.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Clear log
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Cannot reach scraper service</p>
            <p className="mt-0.5 text-xs opacity-75">{error}</p>
            <p className="mt-1 text-xs opacity-60">
              Make sure the service is running at{" "}
              <code className="rounded bg-destructive/15 px-1 py-0.5">NEXT_PUBLIC_SCRAPER_API_URL</code>.
            </p>
          </div>
        </div>
      )}

      {/* ── Status strip ── */}
      {loading && !current ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card py-10 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Fetching service status…
        </div>
      ) : current ? (
        <>
          {/* Quick stats strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Service" indicator={<span className={cn("size-2 rounded-full", online ? "bg-emerald-500" : "bg-destructive")} />}>
              <span className={cn("text-sm font-bold", online ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                {online ? "Online" : "Offline"}
              </span>
            </StatBox>

            <StatBox label="Uptime" indicator={<Clock className="size-2.5 text-muted-foreground" />}>
              <span className="tabular-nums text-sm font-bold text-foreground">
                {formatUptime(current.uptimeSeconds)}
              </span>
            </StatBox>

            <StatBox label="Ingest Lock" indicator={<span className={cn("size-2 rounded-full", busy ? "bg-amber-500" : "bg-emerald-500")} />}>
              <span className={cn("text-sm font-bold", busy ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                {busy ? "Running" : "Idle"}
              </span>
            </StatBox>

            <StatBox label="Checked At" indicator={<Activity className="size-2.5 text-muted-foreground" />}>
              <span className="tabular-nums text-xs font-medium text-foreground">
                {new Date(current.checkedAt).toLocaleTimeString()}
              </span>
            </StatBox>
          </div>

          {/* ── API Quota Cards ── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* SerpAPI Card */}
            <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
              <div className="border-b border-border/60 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Activity className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">SerpAPI · Google Jobs</h3>
                      <p className="text-xs text-muted-foreground">
                        {serpapi?.configured ? "Configured" : "Not configured"}
                      </p>
                    </div>
                  </div>
                  <StatusPill ok={serpapi?.configured === true} label={serpapi?.configured ? "Active" : "Missing key"} />
                </div>
              </div>

              <div className="p-5">
                {!serpapi?.configured ? (
                  <p className="text-sm text-muted-foreground">
                    SerpAPI key not configured on the scraper service.
                  </p>
                ) : !serpAccount ? (
                  <p className="text-sm text-muted-foreground">
                    Live account data not available. (Data is fetched with <code className="rounded bg-muted px-1 py-0.5 text-xs">?live=true</code>.)
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Account meta */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Account</p>
                        <p className="mt-0.5 truncate font-medium text-foreground">{serpAccount.account_email}</p>
                        <p className="text-muted-foreground">{serpAccount.account_status}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Plan</p>
                        <p className="mt-0.5 font-semibold text-foreground">{serpAccount.plan_name}</p>
                        <p className="text-muted-foreground">
                          {serpAccount.plan_monthly_price === 0 ? "Free" : `$${serpAccount.plan_monthly_price}/mo`}
                        </p>
                      </div>
                    </div>

                    {/* Monthly usage */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Monthly searches</span>
                        <span className="tabular-nums text-muted-foreground">
                          {serpAccount.this_month_usage.toLocaleString()} / {serpAccount.searches_per_month.toLocaleString()} used
                        </span>
                      </div>
                      <UsageBar
                        used={serpAccount.this_month_usage}
                        total={serpAccount.searches_per_month}
                        color="bg-violet-500"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{serpAccount.plan_searches_left.toLocaleString()}</span> searches left
                        {serpAccount.extra_credits > 0 && (
                          <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                            + {serpAccount.extra_credits.toLocaleString()} extra credits
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Rate info */}
                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/30 p-3 text-center text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">This hour</p>
                        <p className="mt-0.5 tabular-nums font-bold text-foreground">{serpAccount.this_hour_searches}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Last hour</p>
                        <p className="mt-0.5 tabular-nums font-bold text-foreground">{serpAccount.last_hour_searches}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rate limit</p>
                        <p className="mt-0.5 tabular-nums font-bold text-foreground">{serpAccount.account_rate_limit_per_hour}/hr</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RapidAPI / JSearch Card */}
            <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
              <div className="border-b border-border/60 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Zap className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">RapidAPI · JSearch</h3>
                      <p className="text-xs text-muted-foreground">
                        {rapidapi?.configured ? "Configured" : "Not configured"}
                        {rapidapi?.probed ? " · Probed" : ""}
                      </p>
                    </div>
                  </div>
                  <StatusPill ok={rapidapi?.configured === true} label={rapidapi?.configured ? "Active" : "Missing key"} />
                </div>
              </div>

              <div className="p-5 space-y-4">
                {!rapidapi?.configured ? (
                  <p className="text-sm text-muted-foreground">RapidAPI key not configured.</p>
                ) : !rapidapi.probed ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Quota data requires a live probe. This performs one JSearch request and reads
                      the rate-limit response headers.
                    </p>
                    {rapidapi.note && (
                      <p className="text-xs text-muted-foreground/70">{rapidapi.note}</p>
                    )}
                  </div>
                ) : rapidapi.probeError ? (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <div>
                      <p className="font-medium">Probe failed</p>
                      <p className="mt-0.5 text-xs">{rapidapi.probeError}</p>
                    </div>
                  </div>
                ) : rapidQuota ? (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Plan quota</span>
                        <span className="tabular-nums text-muted-foreground">
                          {(rapidQuota.limit - rapidQuota.remaining).toLocaleString()} / {rapidQuota.limit.toLocaleString()} used
                        </span>
                      </div>
                      <UsageBar
                        used={rapidQuota.limit - rapidQuota.remaining}
                        total={rapidQuota.limit}
                        color="bg-blue-500"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{rapidQuota.remaining.toLocaleString()}</span> remaining
                        {" · "}resets in{" "}
                        <span className="font-semibold text-foreground">{rapidQuota.resetHuman}</span>
                      </p>
                    </div>

                    {rapidapi.probeCountry && (
                      <p className="text-xs text-muted-foreground">
                        Probed via country: <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{rapidapi.probeCountry}</code>
                        {rapidapi.probeStatus && (
                          <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">
                            HTTP {rapidapi.probeStatus}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Quota data unavailable after probe.</p>
                )}

                {/* Probe button */}
                <div className="border-t border-border/60 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-foreground">Probe JSearch API</p>
                      <p className="text-xs text-muted-foreground">
                        Performs one JSearch request to read rate-limit headers.
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="size-3 shrink-0" />
                        Uses 1 RapidAPI credit
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void probeRapidApi()}
                      disabled={probeLoading || loading || busy}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      {probeLoading
                        ? <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        : <Zap className="size-3.5" aria-hidden />}
                      {probeLoading ? "Probing…" : rapidapi?.probed ? "Re-probe" : "Probe"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Poll History Log ── */}
          <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Clock className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Poll History</h3>
                  <p className="text-xs text-muted-foreground">
                    Last {log.length} check{log.length !== 1 ? "s" : ""}
                    {" · "}auto-polls every 30s
                    {" · "}max {MAX_LOG_ENTRIES} entries
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLog([])}
                disabled={log.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Clear
              </button>
            </div>

            <div className="overflow-x-auto">
              {log.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No entries yet — waiting for first poll…
                </p>
              ) : (
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="border-b border-border/60 bg-muted/40">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-muted-foreground">Time</th>
                      <th className="px-4 py-2.5 font-semibold text-muted-foreground">Source</th>
                      <th className="px-4 py-2.5 font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-2.5 font-semibold text-muted-foreground">Uptime</th>
                      <th className="px-4 py-2.5 font-semibold text-muted-foreground">SerpAPI</th>
                      <th className="px-4 py-2.5 font-semibold text-muted-foreground">JSearch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.map((entry, i) => {
                      const e_serpapi  = entry.status.serpapi;
                      const e_rapidapi = entry.status.rapidapi;
                      const e_busy     = entry.status.busy;
                      const serpUsage  = e_serpapi.account
                        ? `${e_serpapi.account.this_month_usage}/${e_serpapi.account.searches_per_month}`
                        : null;
                      const rapidRemain = e_rapidapi.quota?.plan?.remaining;
                      const rapidLimit  = e_rapidapi.quota?.plan?.limit;

                      return (
                        <tr key={entry.id}
                          className={cn(
                            "border-b border-border/60 last:border-0",
                            i === 0 && "bg-primary/5"
                          )}
                        >
                          <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                            {formatShortDateTime(entry.ts)}
                          </td>
                          <td className="px-4 py-2.5">
                            <TriggerBadge trigger={entry.trigger} />
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn(
                              "inline-flex items-center gap-1 font-semibold",
                              e_busy ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                            )}>
                              <span className={cn("size-1.5 rounded-full", e_busy ? "bg-amber-500" : "bg-emerald-500")} />
                              {e_busy ? "Running" : "Idle"}
                            </span>
                          </td>
                          <td className="tabular-nums px-4 py-2.5 text-muted-foreground">
                            {formatUptime(entry.status.uptimeSeconds)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn("font-medium", e_serpapi.configured ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                              {e_serpapi.configured ? "✓" : "✗"}
                            </span>
                            {serpUsage && (
                              <span className="ml-1.5 tabular-nums text-muted-foreground">{serpUsage} used</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn("font-medium", e_rapidapi.configured ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                              {e_rapidapi.configured ? "✓" : "✗"}
                            </span>
                            {rapidRemain != null && rapidLimit != null ? (
                              <span className="ml-1.5 tabular-nums text-muted-foreground">
                                {rapidRemain}/{rapidLimit} left
                              </span>
                            ) : (
                              <span className="ml-1.5 text-muted-foreground/50">no probe</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Service note */}
          {current.note && (
            <p className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              {current.note}
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

function StatBox({ label, indicator, children }: {
  label: string;
  indicator?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {indicator}
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function TriggerBadge({ trigger }: { trigger: LogTrigger }) {
  const map: Record<LogTrigger, { label: string; cls: string }> = {
    auto:   { label: "Auto",   cls: "border-border/60 bg-muted/40 text-muted-foreground" },
    manual: { label: "Manual", cls: "border-primary/30 bg-primary/10 text-primary" },
    probe:  { label: "Probe",  cls: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  };
  const { label, cls } = map[trigger];
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", cls)}>
      {label}
    </span>
  );
}
