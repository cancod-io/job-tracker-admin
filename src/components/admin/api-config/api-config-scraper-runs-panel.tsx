"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play, Square, Zap } from "lucide-react";
import { ScraperRunStatusBadge } from "@/components/admin/api-config/scraper-run-status-badge";
import { RefreshButton } from "@/components/admin/shared/refresh-button";
import { DataTable } from "@/components/ui/data-table";
import { AlertBanner } from "@/components/ui/alert-banner";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  listScraperRuns,
  ScraperRunConflictError,
  startScraperRun,
  stopScraperRun,
} from "@/lib/admin-scraper-runs-api";
import { formatDateTime } from "@/lib/format-date";
import {
  buildScraperRunControlRows,
  buildScraperRunLogFilterOptions,
  formatScraperProviderLabel,
  formatScraperRunDuration,
  formatScraperRunResultToast,
  isActiveScraperRunStatus,
  isTerminalScraperRunStatus,
  scraperRunAppliesToProvider,
} from "@/lib/scraper-provider-utils";
import { REALTIME_SCRAPER_RUN_UPDATED_EVENT } from "@/lib/realtime-sync-events";
import { cn } from "@/lib/utils";
import type { ToastMessage } from "@/hooks/use-toast";
import type { ApiConfigSource } from "@/types/api-config-api";
import type { ScraperRunListResponse, ScraperRunSummary } from "@/types/scraper-runs-api";
import type { ScraperRunUpdatedPayload } from "@/types/realtime";

const DEFAULT_PAGE_SIZE = 20;
const STATUS_SNAPSHOT_LIMIT = 10;
const RUNNING_FETCH_LIMIT = 10;
type ApiConfigScraperRunsPanelProps = {
  accessToken: string;
  canManage: boolean;
  sources: ApiConfigSource[];
  setToast: (toast: ToastMessage | null) => void;
};

type BusyAction = { kind: "start"; provider: string } | { kind: "stop"; runId: string } | null;

function resolveChipStatus(
  provider: string,
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
  provider: string,
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [providerFilter, setProviderFilter] = useState("all");
  const [logData, setLogData] = useState<ScraperRunListResponse | null>(null);
  const [statusSnapshot, setStatusSnapshot] = useState<ScraperRunSummary[]>([]);
  const [runningRuns, setRunningRuns] = useState<ScraperRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [conflict, setConflict] = useState<{
    message: string;
    activeRun: ScraperRunSummary | null;
  } | null>(null);

  const statusByRunIdRef = useRef<Map<string, string>>(new Map());
  const loadRequestRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const filterOptions = useMemo(() => buildScraperRunLogFilterOptions(sources), [sources]);

  const refreshRuns = useCallback(
    async (options?: { manual?: boolean }) => {
      const requestId = ++loadRequestRef.current;
      const isInitial = !hasLoadedRef.current && !options?.manual;
      if (options?.manual) {
        setRefreshing(true);
      } else if (isInitial) {
        setLoading(true);
      } else {
        setLogLoading(true);
      }

      const offset = (page - 1) * pageSize;
      const logProvider = providerFilter === "all" ? undefined : providerFilter;

      try {
        const [log, runningListed, snapshot] = await Promise.all([
          listScraperRuns(accessToken, { limit: pageSize, offset, provider: logProvider }),
          listScraperRuns(accessToken, { status: "running", limit: RUNNING_FETCH_LIMIT }),
          listScraperRuns(accessToken, { limit: STATUS_SNAPSHOT_LIMIT }),
        ]);
        if (requestId !== loadRequestRef.current) return;

        const activeById = new Map<string, ScraperRunSummary>();
        for (const run of runningListed.items) {
          activeById.set(run.run_id, run);
        }
        for (const run of [...snapshot.items, ...log.items]) {
          if (isActiveScraperRunStatus(run.status)) {
            activeById.set(run.run_id, run);
          }
        }
        const activeRuns = [...activeById.values()];

        const prevStatuses = statusByRunIdRef.current;
        const nextStatuses = new Map<string, string>();

        for (const run of [...activeRuns, ...snapshot.items, ...log.items]) {
          const prev = prevStatuses.get(run.run_id);
          nextStatuses.set(run.run_id, run.status);

          if (
            prev &&
            isActiveScraperRunStatus(prev) &&
            isTerminalScraperRunStatus(run.status)
          ) {
            const toastMessage = formatScraperRunResultToast({
              provider: run.provider,
              status: run.status,
              added_count: run.added_count,
              blocked_count: run.blocked_count,
              error_message: run.error_message,
            });
            if (toastMessage) {
              setToast({
                kind: run.status === "success" ? "success" : "error",
                message: toastMessage,
              });
            }
          }
        }

        statusByRunIdRef.current = nextStatuses;
        setLogData(log);
        setStatusSnapshot(snapshot.items);
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
          hasLoadedRef.current = true;
          setLoading(false);
          setRefreshing(false);
          setLogLoading(false);
        }
      }
    },
    [accessToken, page, pageSize, providerFilter, setToast],
  );

  useEffect(() => {
    void refreshRuns();
  }, [refreshRuns]);

  useEffect(() => {
    const onScraperRunUpdated = (event: Event) => {
      const payload = (event as CustomEvent<ScraperRunUpdatedPayload>).detail;
      if (!payload) return;

      if (isTerminalScraperRunStatus(payload.status)) {
        const toastMessage = formatScraperRunResultToast({
          provider: payload.provider,
          status: payload.status,
          added_count: payload.added_count,
          blocked_count: payload.blocked_count,
          error_message: payload.error_message,
        });
        if (toastMessage) {
          setToast({
            kind: payload.status === "success" ? "success" : "error",
            message: toastMessage,
          });
        }
      }

      void refreshRuns();
    };

    window.addEventListener(REALTIME_SCRAPER_RUN_UPDATED_EVENT, onScraperRunUpdated);
    return () =>
      window.removeEventListener(REALTIME_SCRAPER_RUN_UPDATED_EVENT, onScraperRunUpdated);
  }, [refreshRuns, setToast]);

  const handleStart = async (provider: string) => {
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
      buildScraperRunControlRows(sources).map((row) => ({
        ...row,
        activeRuns: findActiveRunsForProvider(row.provider, runningRuns),
        status: resolveChipStatus(row.provider, runningRuns, statusSnapshot),
      })),
    [sources, runningRuns, statusSnapshot],
  );

  const logRuns = logData?.items ?? [];
  const paginationTotal = Math.max(0, logData?.total ?? 0);
  const paginationPageSize = Math.max(1, logData?.limit ?? pageSize);
  const totalPages = Math.max(1, Math.ceil(paginationTotal / paginationPageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart =
    paginationTotal === 0 ? 0 : (currentPage - 1) * paginationPageSize + 1;
  const rangeEnd = Math.min(
    paginationTotal,
    (currentPage - 1) * paginationPageSize + logRuns.length,
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

      {controlRows.length === 0 && !loading ? (
        <AlertBanner variant="warning">
          No scraper providers are configured yet. Add API keys on the Keys tab first.
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
                <tr key={row.provider} className="border-b border-border/60 last:border-b-0">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-foreground">Run log</h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Provider</span>
              <select
                value={providerFilter}
                onChange={(e) => {
                  setProviderFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
                aria-label="Filter run log by provider"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {paginationTotal > 0 ? (
              <p className="text-xs text-muted-foreground">
                {paginationTotal} {paginationTotal === 1 ? "run" : "runs"} total
              </p>
            ) : null}
          </div>
        </div>

        <DataTable
          loading={(loading || logLoading) && logRuns.length === 0}
          loadingMessage="Loading scraper runs…"
          minWidth="960px"
        >
          {!loading || logRuns.length > 0 ? (
            <>
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 font-medium">Blocked</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {logRuns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No scraper runs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logRuns.map((run) => (
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
                      <td className="px-4 py-3 tabular-nums text-sm">{run.blocked_count ?? 0}</td>
                      <td className="px-4 py-3 tabular-nums text-sm">{run.received_count ?? "—"}</td>
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

        {logData ? (
          <PaginationBar
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={paginationTotal}
            countLabel="runs"
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            disablePrev={page <= 1 || loading || logLoading || refreshing}
            disableNext={page >= totalPages || loading || logLoading || refreshing}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
