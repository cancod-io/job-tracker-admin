"use client";

import { Activity, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date";
import { formatJobSourceLabel } from "@/lib/job-source-utils";
import type { ApiFetchRun } from "@/types/api-fetch-runs";

type AdminFetchRunsPanelProps = {
  source: string;
  runs: ApiFetchRun[];
  loading: boolean;
  selectedRunId: number | null;
  diffActive: boolean;
  canDeleteRuns: boolean;
  onSelectRun: (run: ApiFetchRun) => void;
  onClearDiff: () => void;
  onDeleteRun: (run: ApiFetchRun) => void;
};

const SEGMENT_CLASS = {
  added: "bg-emerald-500",
  updated: "bg-sky-500",
  unchanged: "bg-muted-foreground/40",
  removed: "bg-rose-500",
} as const;

function DiffCompositionBar({ run }: { run: ApiFetchRun }) {
  const total =
    run.added_count + run.updated_count + run.unchanged_count + run.removed_count || 1;

  const segments = [
    { key: "added" as const, count: run.added_count },
    { key: "updated" as const, count: run.updated_count },
    { key: "unchanged" as const, count: run.unchanged_count },
    { key: "removed" as const, count: run.removed_count },
  ].filter((s) => s.count > 0);

  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/80"
      aria-hidden
      title="Added · Updated · Unchanged · Removed"
    >
      {segments.map((seg) => (
        <div
          key={seg.key}
          className={cn("h-full transition-all", SEGMENT_CLASS[seg.key])}
          style={{ width: `${(seg.count / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

function RunCard({
  run,
  selected,
  canDelete,
  onSelect,
  onDelete,
}: {
  run: ApiFetchRun;
  selected: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const isInitial = run.previous_run_id == null;
  const deltaTotal = run.added_count + run.updated_count + run.removed_count;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-w-[14rem] max-w-[16rem] shrink-0 cursor-pointer flex-col gap-3 rounded-xl border p-3.5 text-left transition-all",
        selected
          ? "border-primary/60 bg-gradient-to-br from-primary/12 via-card to-card shadow-md ring-2 ring-primary/25"
          : "border-border/80 bg-card hover:border-primary/35 hover:shadow-sm",
      )}
    >
      {selected ? (
        <span
          className="pointer-events-none absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
          aria-hidden
        >
          <Sparkles className="size-3" />
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">
            {formatDateTime(run.started_at)}
          </p>
          <p className="text-[10px] text-muted-foreground">Run #{run.id}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canDelete ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="inline-flex size-7 items-center justify-center rounded-md border border-destructive/30 text-destructive transition-colors hover:bg-destructive/10"
              aria-label={`Delete fetch run ${run.id}`}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          ) : null}
        {isInitial ? (
          <span className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Baseline
          </span>
        ) : (
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-muted-foreground">
            Δ {deltaTotal}
          </span>
        )}
        </div>
      </div>

      <DiffCompositionBar run={run} />

      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
        <div className="flex items-center justify-between gap-1">
          <dt className="text-emerald-700 dark:text-emerald-300">Added</dt>
          <dd className="font-semibold tabular-nums text-foreground">{run.added_count}</dd>
        </div>
        <div className="flex items-center justify-between gap-1">
          <dt className="text-sky-700 dark:text-sky-300">Updated</dt>
          <dd className="font-semibold tabular-nums text-foreground">{run.updated_count}</dd>
        </div>
        <div className="flex items-center justify-between gap-1">
          <dt className="text-muted-foreground">Same</dt>
          <dd className="font-semibold tabular-nums text-foreground">{run.unchanged_count}</dd>
        </div>
        <div className="flex items-center justify-between gap-1">
          <dt className="text-rose-700 dark:text-rose-300">Removed</dt>
          <dd className="font-semibold tabular-nums text-foreground">{run.removed_count}</dd>
        </div>
      </dl>

      <p className="text-[10px] tabular-nums text-muted-foreground">
        {run.total_jobs.toLocaleString()} jobs in catalog
      </p>
    </div>
  );
}

export function AdminFetchRunsPanel({
  source,
  runs,
  loading,
  selectedRunId,
  diffActive,
  canDeleteRuns,
  onSelectRun,
  onClearDiff,
  onDeleteRun,
}: AdminFetchRunsPanelProps) {
  const sourceLabel = formatJobSourceLabel(source);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-muted/50 via-card to-card shadow-sm"
      aria-label={`Ingest history for ${sourceLabel}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-muted/30 px-4 py-3 md:px-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <Activity className="size-4" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ingest diff explorer</h3>
            <p className="text-xs text-muted-foreground">
              {sourceLabel} — select a run to filter listings by what changed
            </p>
          </div>
        </div>
        {diffActive ? (
          <button
            type="button"
            onClick={onClearDiff}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
            Clear diff filter
          </button>
        ) : null}
      </div>

      <div className="p-4 md:p-5">
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[10.5rem] min-w-[14rem] shrink-0 animate-pulse rounded-xl border border-border/60 bg-muted/40"
              />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ingest runs recorded for this source yet.</p>
        ) : (
          <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-1">
            {runs.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                selected={selectedRunId === run.id}
                canDelete={canDeleteRuns}
                onSelect={() => onSelectRun(run)}
                onDelete={() => onDeleteRun(run)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
