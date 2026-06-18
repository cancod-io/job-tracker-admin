"use client";

import { useEffect, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  EMPTY_SCAM_URL_FILTERS,
  type ScamUrlClientFilters,
} from "@/components/admin/scam-urls/apply-filters";
import { BLOCK_LIST_REASON_OPTIONS, SCAM_URL_TYPE_OPTIONS } from "@/components/admin/scam-urls/constants";

type ScamUrlsFiltersPanelProps = {
  open: boolean;
  onClose: () => void;
  draft: ScamUrlClientFilters;
  onDraftChange: (filters: ScamUrlClientFilters) => void;
  onApply: () => void;
  onReset: () => void;
  addedByOptions: string[];
};

export function ScamUrlsFiltersPanel({
  open,
  onClose,
  draft,
  onDraftChange,
  onApply,
  onReset,
  addedByOptions,
}: ScamUrlsFiltersPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-20 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-border/80 bg-card p-4 shadow-lg"
      role="dialog"
      aria-label="Block Lists filters"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="filter-type" className="text-xs font-medium text-muted-foreground">
            Type
          </label>
          <select
            id="filter-type"
            value={draft.urlType}
            onChange={(e) =>
              onDraftChange({
                ...draft,
                urlType: e.target.value as ScamUrlClientFilters["urlType"],
              })
            }
            className="w-full rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
          >
            {SCAM_URL_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="filter-reason" className="text-xs font-medium text-muted-foreground">
            Reason
          </label>
          <select
            id="filter-reason"
            value={draft.reason}
            onChange={(e) => onDraftChange({ ...draft, reason: e.target.value })}
            className="w-full rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
          >
            <option value="">All Reasons</option>
            {BLOCK_LIST_REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="filter-added-by" className="text-xs font-medium text-muted-foreground">
            Added By
          </label>
          <select
            id="filter-added-by"
            value={draft.addedBy}
            onChange={(e) => onDraftChange({ ...draft, addedBy: e.target.value })}
            className="w-full rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
          >
            <option value="">All Admins</option>
            {addedByOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Date Range</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={draft.dateFrom}
              onChange={(e) => onDraftChange({ ...draft, dateFrom: e.target.value })}
              className="rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
              aria-label="Date from"
            />
            <input
              type="date"
              value={draft.dateTo}
              onChange={(e) => onDraftChange({ ...draft, dateTo: e.target.value })}
              className="rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
              aria-label="Date to"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            onDraftChange(EMPTY_SCAM_URL_FILTERS);
            onReset();
          }}
          className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            onApply();
            onClose();
          }}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

export function ScamUrlsFiltersButton({
  filtersOpen,
  filtersActive,
  onToggle,
}: {
  filtersOpen: boolean;
  filtersActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      aria-expanded={filtersOpen}
      aria-haspopup="dialog"
    >
      <SlidersHorizontal className="size-4" aria-hidden />
      Filters
      {filtersActive ? (
        <span className="inline-flex size-2 rounded-full bg-primary" aria-label="Filters active" />
      ) : null}
    </button>
  );
}
