"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play, Square, Zap } from "lucide-react";
import { ScraperRunStatusBadge } from "@/components/admin/api-config/scraper-run-status-badge";
import { RefreshButton } from "@/components/admin/shared/refresh-button";
import { DataTable } from "@/components/ui/data-table";
import { AlertBanner } from "@/components/ui/alert-banner";
import {
  listScraperRuns,
  ScraperRunConflictError,
  startScraperRun,
  stopScraperRun,
} from "@/lib/admin-scraper-runs-api";
import { formatDateTime } from "@/lib/format-date";
import {
  formatScraperProviderLabel,
  formatScraperRunDuration,
  formatScraperRunResultToast,
  isActiveScraperRunStatus,
  isTerminalScraperRunStatus,
  SCRAPER_RUN_CONTROL_ROWS,
  scraperRunAppliesToProvider,
} from "@/lib/scraper-provider-utils";
import { cn } from "@/lib/utils";
import type { ToastMessage } from "@/hooks/use-toast";
import type { ApiConfigSource } from "@/types/api-config-api";
import type { ScraperRunSummary } from "@/types/scraper-runs-api";

const RECENT_RUNS_LIMIT = 20;

type ApiConfigScraperRunsPanelProps = {
  accessToken: string;
  canManage: boolean;
  sources: ApiConfigSource[];
  setToast: (toast: ToastMessage | null) => void;
};

type BusyAction =
  | { kind: "start"; provider: (typeof SCRAPER_RUN_CONTROL_ROWS)[number]["provider"] }
  | { kind: "stop"; runId: string }
  | null;

function isSourceKeyConfigured(sources: ApiConfigSource[], sourceId: string): boolean {
  return sources.some((source) => source.id === sourceId && source.is_set);
}

function resolveChipStatus(
  provider: (typeof SCRAPER_RUN_CONTROL_ROWS)[number]["provider"],
  runningRuns: ScraperRunSummary[],
  recentRuns: ScraperRunSummary[],
): string {
  const active = runningRuns.find((run) => scraperRunAppliesToProvider(run.provider, provider));
  if (active) return active.status;

  const latest = recentRuns.find((run) => scraperRunAppliesToProvider(run.provider, provider));
  if (latest && isTerminalScraperRunStatus(latest.status)) return latest.status;
  return "idle";
}

function findActiveRunsForProvider(
  provider: (typeof SCRAPER_RUN_CONTROL_ROWS)[number]["provider"],
  runningRuns: ScraperRunSummary[],
): ScraperRunSummary[] {
  return runningRuns.filter((run) => scraperRunAppliesToProvider(run.provider, provider));
}

export function ApiConfigScraperRunsPanel({
  accessToken,
  canManage,
  sources,
  setToast,
}: ApiConfigScraperRunsPanelProps) {
  const [recentRuns, setRecentRuns] = useState<ScraperRunSummary[]>([]);
  const [runningRuns, setRunningRuns] = useState<ScraperRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [conflict, setConflict] = useState<{
    message: string;
    activeRun: ScraperRunSummary | null;
  } | null>(null);

  const statusByRunIdRef = useRef<Map<string, string>>(new Map());
  const loadRequestRef = useRef(0);

  const keyConfigured = useMemo(
    () => ({
      serpapi: isSourceKeyConfigured(sources, "serpapi"),
      fantastic: isSourceKeyConfigured(sources, "fantastic_jobs"),
    }),
    [sources],
  );

  const refreshRuns = useCallback(
    async (options?: { manual?: boolean }) => {
      const requestId = ++loadRequestRef.current;
      if (options?.manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const [recent, runningListed] = await Promise.all([
          listScraperRuns(accessToken, { limit: RECENT_RUNS_LIMIT }),
          listScraperRuns(accessToken, { status: "running", limit: 10 }),
        ]);
        if (requestId !== loadRequestRef.current) return;

        const activeById = new Map<string, ScraperRunSummary>();
        for (const run of runningListed.items) {
          activeById.set(run.run_id, run);
        }
        for (const run of recent.items) {
          if (isActiveScraperRunStatus(run.status)) {
            activeById.set(run.run_id, run);
          }
        }
        const activeRuns = [...activeById.values()];

        const prevStatuses = statusByRunIdRef.current;
        const nextStatuses = new Map<string, string>();

        for (const run of [...activeRuns, ...recent.items]) {
          const prev = prevStatuses.get(run.run_id);
          nextStatuses.set(run.run_id, run.status);

          if (
            prev &&
            isActiveScraperRunStatus(prev) &&
            isTerminalScraperRunStatus(run.status)
          ) {
            const toastMessage = formatScraperRunResultToast(run);
            if (toastMessage) {
              setToast({
                kind: run.status === "success" ? "success" : "error",
                message: toastMessage,
              });
            }
          }
        }

        statusByRunIdRef.current = nextStatuses;
        setRecentRuns(recent.items);
        setRunningRuns(activeRuns);
        setLoadError(null);

        if (activeRuns.length === 0) {
          setConflict((current) => (current?.activeRun ? null : current));
        }
      } catch (e) {
      if (requestId !== loadRequestRef.current) return;
      setLoadError(e instanceof Error ? e.message : "Failed to load scraper runs.");
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  },
    [accessToken, setToast],
  );

  useEffect(() => {
    void refreshRuns();
  }, [refreshRuns]);

  const handleStart = async (
    provider: (typeof SCRAPER_RUN_CONTROL_ROWS)[number]["provider"],
  ) => {
    if (!canManage) return;
    setBusy({ kind: "start", provider });
    setConflict(null);
    try {
      const started = await startScraperRun(accessToken, { provider });
      setToast({
        kind: "success",
        message: `${formatScraperProviderLabel(started.provider)} run started.`,
      });
      await refreshRuns({ manual: true });
    } catch (e) {
      if (e instanceof ScraperRunConflictError) {
        setConflict({ message: e.message, activeRun: e.activeRun });
        await refreshRuns({ manual: true });
        const activeLabel = e.activeRun
          ? `${formatScraperProviderLabel(e.activeRun.provider)} (run ${e.activeRun.run_id})`
          : "another provider";
        setToast({
          kind: "error",
          message: `${e.message} Active: ${activeLabel}. Use Stop to cancel it.`,
        });
        return;
      }
      setToast({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to start scraper run.",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleStop = async (runs: ScraperRunSummary[]) => {
    const firstRun = runs[0];
    if (!canManage || !firstRun) return;
    setBusy({ kind: "stop", runId: firstRun.run_id });
    setConflict(null);
    try {
      for (const run of runs) {
        await stopScraperRun(accessToken, run.run_id);
      }
      setToast({
        kind: "success",
        message:
          runs.length === 1
            ? `${formatScraperProviderLabel(firstRun.provider)} run stop requested.`
            : `Stop requested for ${runs.length} active runs.`,
      });
      await refreshRuns({ manual: true });
    } catch (e) {
      setToast({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to stop scraper run.",
      });
    } finally {
      setBusy(null);
    }
  };

  const controlRows = useMemo(
    () =>
      SCRAPER_RUN_CONTROL_ROWS.map((row) => ({
        key: row.provider,
        label: row.label,
        provider: row.provider,
        sourceId: row.sourceId,
        canRun: row.provider === "serpapi" ? keyConfigured.serpapi : keyConfigured.fantastic,
        activeRuns: findActiveRunsForProvider(row.provider, runningRuns),
        status: resolveChipStatus(row.provider, runningRuns, recentRuns),
      })),
    [keyConfigured.fantastic, keyConfigured.serpapi, recentRuns, runningRuns],
  );

  const conflictRun = conflict?.activeRun ?? runningRuns[0] ?? null;

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Zap className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Scraper runs</h2>
            <p className="text-xs text-muted-foreground">
              Start or stop job fetches per provider. Use Refresh to update status and history.
            </p>
          </div>
        </div>
        <RefreshButton
          onClick={() => void refreshRuns({ manual: true })}
          loading={refreshing}
          ariaLabel="Refresh scraper runs"
        />
      </div>

      {loadError ? <AlertBanner variant="warning">{loadError}</AlertBanner> : null}

      {conflict ? (
        <AlertBanner variant="warning">
          <p>{conflict.message}</p>
          {conflictRun ? (
            <p className="mt-1 text-xs opacity-90">
              Active run: {formatScraperProviderLabel(conflictRun.provider)} · started{" "}
              {formatDateTime(conflictRun.started_at)} ·{" "}
              <span className="font-mono">{conflictRun.run_id}</span>
            </p>
          ) : null}
        </AlertBanner>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border/80">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Run</th>
              <th className="px-4 py-3 text-right font-medium">Stop</th>
            </tr>
          </thead>
          <tbody>
            {controlRows.map((row) => {
              const starting = busy?.kind === "start" && busy.provider === row.provider;
              const stopping =
                busy?.kind === "stop" &&
                row.activeRuns.some((run) => run.run_id === busy.runId);
              const runDisabled =
                !canManage || !row.canRun || row.activeRuns.length > 0 || busy !== null;
              const stopDisabled = !canManage || row.activeRuns.length === 0 || busy !== null;

              return (
                <tr key={row.key} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                  <td className="px-4 py-3">
                    <ScraperRunStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={runDisabled}
                      title={
                        !row.canRun
                          ? "Configure and activate an API key first."
                          : row.activeRuns.length > 0
                            ? "A run is already active for this provider."
                            : undefined
                      }
                      onClick={() => void handleStart(row.provider)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      {starting ? (
                        <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
                      ) : (
                        <Play className="size-3.5" aria-hidden />
                      )}
                      Run
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={stopDisabled}
                      onClick={() => void handleStop(row.activeRuns)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {stopping ? (
                        <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
                      ) : (
                        <Square className="size-3.5" aria-hidden />
                      )}
                      Stop
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Recent runs</h3>
          <p className="text-xs text-muted-foreground">Last {RECENT_RUNS_LIMIT} runs</p>
        </div>

        <DataTable
          loading={loading && recentRuns.length === 0}
          loadingMessage="Loading scraper runs…"
          minWidth="960px"
        >
          {!loading || recentRuns.length > 0 ? (
            <>
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Unchanged</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No scraper runs recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentRuns.map((run) => (
                    <tr
                      key={run.run_id}
                      className="border-b border-border/60 last:border-b-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {formatScraperProviderLabel(run.provider)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(run.started_at)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-sm text-foreground">
                        {formatScraperRunDuration(run.duration_ms)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-sm">{run.added_count}</td>
                      <td className="px-4 py-3 tabular-nums text-sm">{run.updated_count}</td>
                      <td className="px-4 py-3 tabular-nums text-sm">{run.unchanged_count}</td>
                      <td className="px-4 py-3">
                        <ScraperRunStatusBadge status={run.status} />
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-3 text-xs text-destructive">
                        {run.error_message ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          ) : null}
        </DataTable>
      </div>
    </section>
  );
}
