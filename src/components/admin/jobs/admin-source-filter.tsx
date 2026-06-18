"use client";

import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJobSourceLabel } from "@/lib/job-source-utils";

export const ALL_JOB_SOURCES_VALUE = "";

type AdminSourceFilterProps = {
  value: string;
  options: string[];
  loading?: boolean;
  onChange: (source: string) => void;
};

export function AdminSourceFilter({
  value,
  options,
  loading = false,
  onChange,
}: AdminSourceFilterProps) {
  const pills: { id: string; label: string }[] = [
    { id: ALL_JOB_SOURCES_VALUE, label: "All sources" },
    ...options.map((opt) => ({ id: opt, label: formatJobSourceLabel(opt) })),
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 p-3 shadow-sm backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <Layers className="size-4 text-primary" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Filter by source
        </p>
        {loading ? (
          <span className="text-[10px] text-muted-foreground" aria-live="polite">
            Loading…
          </span>
        ) : null}
      </div>
      <div className="scrollbar-thin flex flex-wrap gap-2">
        {pills.map((pill) => {
          const active = value === pill.id;
          return (
            <button
              key={pill.id || "__all__"}
              type="button"
              disabled={loading}
              onClick={() => onChange(pill.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-60",
                active
                  ? "border-primary/50 bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground",
              )}
              aria-pressed={active}
            >
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
