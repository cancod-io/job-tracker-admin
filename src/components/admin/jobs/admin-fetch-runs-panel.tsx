"use client";

import { Activity, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date";
import {
  formatFetchRunCountSummary,
  type ApiFetchRun,
} from "@/types/api-fetch-runs";

type AdminFetchRunsPanelProps = {
  sourceLabel: string;
  runs: ApiFetchRun[];
  loading: boolean;
  selectedRunId: number | null;
  diffActive: boolean;
  canDeleteRuns: boolean;
  onSelectRun: (run: ApiFetchRun) => void;
  onClearDiff: () => void;
  onDeleteRun: (run: ApiFetchRun) => void;
};

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
        </div>
      </div>

      <div
        className={cn(
          "h-1.5 w-full overflow-hidden rounded-full",
          run.added_count > 0 ? "bg-emerald-500/20" : "bg-muted/80",
        )}
        aria-hidden
      >
        {run.added_count > 0 ? (
          <div className="h-full w-full rounded-full bg-emerald-500" />
        ) : null}
      </div>

      <p className="text-xs font-medium text-foreground">{formatFetchRunCountSummary(run)}</p>

      {run.added_count === 0 ? (
        <p className="text-[10px] text-muted-foreground">
          No new jobs — all apply URLs already exist.
        </p>
      ) : null}

      <p className="text-[10px] tabular-nums text-muted-foreground">
        {run.total_jobs.toLocaleString()} jobs in catalog
      </p>
    </div>
  );
}

export function AdminFetchRunsPanel({
  sourceLabel,
  runs,
  loading,
  selectedRunId,
  diffActive,
  canDeleteRuns,
  onSelectRun,
  onClearDiff,
  onDeleteRun,
}: AdminFetchRunsPanelProps) {
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
            <h3 className="text-sm font-semibold text-foreground">Ingest explorer</h3>
            <p className="text-xs text-muted-foreground">
              {sourceLabel} — select a run to view newly added jobs
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
            Clear run filter
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
