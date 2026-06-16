"use client";

import { Trash2 } from "lucide-react";

type BulkSelectionBarProps = {
  count: number;
  entityLabel: string;
  entityLabelPlural?: string;
  busy?: boolean;
  onClear: () => void;
  onDelete: () => void;
  deleteLabel?: string;
};

export function BulkSelectionBar({
  count,
  entityLabel,
  entityLabelPlural,
  busy = false,
  onClear,
  onDelete,
  deleteLabel = "Delete selected",
}: BulkSelectionBarProps) {
  const plural = entityLabelPlural ?? `${entityLabel}s`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
      <p className="text-sm text-foreground">
        <span className="font-semibold tabular-nums">{count}</span>{" "}
        {count === 1 ? entityLabel : plural} selected on this page
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="rounded-lg border border-border/80 bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Clear selection
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/15 disabled:opacity-50"
        >
          <Trash2 className="size-4" aria-hidden />
          {deleteLabel}
        </button>
      </div>
    </div>
  );
}
