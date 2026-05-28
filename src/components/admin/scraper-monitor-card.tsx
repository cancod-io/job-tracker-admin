"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { formatShortTime, formatUptime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { useMonitorStatus } from "@/hooks/use-monitor-status";

export function ScraperMonitorCard() {
  const { status, loading, error, lastFetched, refetch } = useMonitorStatus({
    live: false,
    intervalMs: 30_000,
  });

  const online = !error && status !== null;
  const busy = status?.busy === true;
  const serpOk = status?.serpapi?.configured === true;
  const rapidOk = status?.rapidapi?.configured === true;

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Activity className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">System Monitor</h2>
            <p className="text-xs text-muted-foreground">
              {lastFetched ? `Updated ${formatShortTime(lastFetched)}` : "Loading…"}
              {" · "}auto‑refresh 30s
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden />
          Refresh
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading && !status ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Connecting to scraper service…
          </div>
        ) : error && !status ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Scraper service unreachable</p>
              <p className="mt-0.5 text-xs opacity-75">{error}</p>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Service */}
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className={cn("size-2 rounded-full", online ? "bg-emerald-500" : "bg-destructive")} />
                Service
              </dt>
              <dd className={cn("mt-1.5 text-sm font-semibold", online ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                {online ? "Online" : "Offline"}
              </dd>
            </div>

            {/* Uptime */}
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="size-2.5" aria-hidden />
                Uptime
              </dt>
              <dd className="mt-1.5 tabular-nums text-sm font-semibold text-foreground">
                {status?.uptimeSeconds != null ? formatUptime(status.uptimeSeconds) : "—"}
              </dd>
            </div>

            {/* Ingest */}
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className={cn("size-2 rounded-full", status == null ? "bg-muted-foreground/40" : busy ? "bg-amber-500" : "bg-emerald-500")} />
                Ingest
              </dt>
              <dd className={cn("mt-1.5 text-sm font-semibold",
                status == null ? "text-muted-foreground" : busy ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              )}>
                {status == null ? "—" : busy ? "Running" : "Idle"}
              </dd>
            </div>

            {/* APIs */}
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                APIs
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {[
                  { label: "SerpAPI", ok: serpOk },
                  { label: "JSearch", ok: rapidOk },
                ].map(({ label, ok }) => (
                  <span key={label} className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  )}>
                    {ok ? <CheckCircle2 className="size-3 shrink-0" aria-hidden /> : <XCircle className="size-3 shrink-0" aria-hidden />}
                    {label}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
