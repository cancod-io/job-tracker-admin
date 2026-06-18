"use client";

import { Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  API_FETCH_CHANGE_TYPES,
  fetchChangeLabel,
  type ApiFetchChangeType,
  type ApiFetchRun,
} from "@/types/api-fetch-runs";

type AdminFetchChangeBarProps = {
  run: ApiFetchRun;
  activeChange: ApiFetchChangeType;
  onChange: (change: ApiFetchChangeType) => void;
};

const CHANGE_META: Record<
  ApiFetchChangeType,
  { icon: typeof Plus; accent: string; ring: string; bg: string }
> = {
  added: {
    icon: Plus,
    accent: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/30",
    bg: "from-emerald-500/15 to-emerald-500/5",
  },
  updated: {
    icon: RefreshCw,
    accent: "text-sky-700 dark:text-sky-300",
    ring: "ring-sky-500/30",
    bg: "from-sky-500/15 to-sky-500/5",
  },
  unchanged: {
    icon: Minus,
    accent: "text-muted-foreground",
    ring: "ring-border",
    bg: "from-muted/80 to-muted/30",
  },
  removed: {
    icon: Trash2,
    accent: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-500/30",
    bg: "from-rose-500/15 to-rose-500/5",
  },
};

function countForChange(run: ApiFetchRun, change: ApiFetchChangeType): number {
  switch (change) {
    case "added":
      return run.added_count;
    case "updated":
      return run.updated_count;
    case "unchanged":
      return run.unchanged_count;
    case "removed":
      return run.removed_count;
  }
}

export function AdminFetchChangeBar({ run, activeChange, onChange }: AdminFetchChangeBarProps) {
  return (
    <div
      className="rounded-2xl border border-border/80 bg-card p-2 shadow-sm"
      role="tablist"
      aria-label="Filter jobs by change type for selected ingest run"
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {API_FETCH_CHANGE_TYPES.map((change) => {
          const active = activeChange === change;
          const count = countForChange(run, change);
          const meta = CHANGE_META[change];
          const Icon = meta.icon;

          return (
            <button
              key={change}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(change)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition-all",
                active
                  ? cn(
                      "border-primary/40 bg-gradient-to-br shadow-sm ring-2",
                      meta.bg,
                      meta.ring,
                    )
                  : "border-transparent bg-muted/20 hover:border-border hover:bg-muted/40",
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", meta.accent)}>
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {fetchChangeLabel(change)}
                </span>
                <span
                  className={cn(
                    "inline-flex min-w-[1.75rem] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                    active ? "bg-background/80 text-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {active ? "Showing these listings" : "Click to filter table"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
