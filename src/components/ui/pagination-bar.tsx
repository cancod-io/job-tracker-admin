"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination-constants";
import { cn } from "@/lib/utils";

type PaginationBarProps = {
  variant?: "top" | "bottom";
  /** Range mode: show "X to Y of Z results" */
  rangeStart?: number;
  rangeEnd?: number;
  total: number;
  /** Count mode: show "X of Y jobs" (or custom label) */
  shown?: number;
  countLabel?: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  disablePrev: boolean;
  disableNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
};

export function PaginationBar({
  variant = "bottom",
  rangeStart,
  rangeEnd,
  total,
  shown,
  countLabel = "results",
  currentPage,
  totalPages,
  pageSize,
  disablePrev,
  disableNext,
  onPrev,
  onNext,
  onPageSizeChange,
}: PaginationBarProps) {
  const useRange = rangeStart !== undefined && rangeEnd !== undefined;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        variant === "bottom" ? "border-t border-border/60 pt-4" : "border-b border-border/60 pb-4",
      )}
    >
      <p className="text-xs text-muted-foreground">
        {useRange ? (
          <>
            Showing <span className="tabular-nums">{rangeStart}</span> to{" "}
            <span className="tabular-nums">{rangeEnd}</span> of{" "}
            <span className="tabular-nums">{total}</span> {countLabel}
          </>
        ) : (
          <>
            Showing <span className="tabular-nums">{shown ?? 0}</span> of{" "}
            <span className="tabular-nums">{total}</span> {countLabel}
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-border/80 bg-card px-2 py-1.5 text-sm text-foreground"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex items-center rounded-lg border border-border/80 bg-card p-2 text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            disabled={disablePrev}
            onClick={onPrev}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="px-2 text-xs tabular-nums text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="inline-flex items-center rounded-lg border border-border/80 bg-card p-2 text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            disabled={disableNext}
            onClick={onNext}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
