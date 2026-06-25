"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateRange, toDateKey } from "@/lib/date-utils";
import { Popover } from "@/components/ui/popover";

type DateRangeFilterProps = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  /** Defaults to jobs posted-date label when omitted. */
  ariaLabel?: string;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildMonth(year: number, month: number): (Date | null)[] {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

type Preset = { label: string; range: () => [string, string] };

const PRESETS: Preset[] = [
  { label: "Today", range: () => { const k = toDateKey(new Date()); return [k, k]; } },
  {
    label: "Last 7 days",
    range: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return [toDateKey(start), toDateKey(end)];
    },
  },
  {
    label: "This week",
    range: () => {
      const start = startOfWeek(new Date());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return [toDateKey(start), toDateKey(end)];
    },
  },
  {
    label: "This month",
    range: () => {
      const now = new Date();
      return [
        toDateKey(new Date(now.getFullYear(), now.getMonth(), 1)),
        toDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      ];
    },
  },
  {
    label: "Last 30 days",
    range: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return [toDateKey(start), toDateKey(end)];
    },
  },
];

type RangePanelProps = {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
};

function RangePanel({ from, to, onApply, onClear }: RangePanelProps) {
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [viewDate, setViewDate] = useState(() => {
    const anchor = from || to;
    if (anchor) {
      const parts = anchor.split("-");
      return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    }
    return new Date();
  });

  const months = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    return [
      { year: y, month: m, cells: buildMonth(y, m) },
      { year: m === 11 ? y + 1 : y, month: (m + 1) % 12, cells: buildMonth(m === 11 ? y + 1 : y, (m + 1) % 12) },
    ];
  }, [viewDate]);

  const todayKey = toDateKey(new Date());

  function handleDayClick(date: Date) {
    const key = toDateKey(date);
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(key);
      setDraftTo("");
      return;
    }
    if (key < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(key);
    } else {
      setDraftTo(key);
    }
  }

  function inRange(key: string): boolean {
    if (!draftFrom) return false;
    return key >= draftFrom && key <= (draftTo || draftFrom);
  }

  return (
    <div className="flex rounded-2xl border border-border bg-card shadow-2xl">
      <div className="flex w-36 shrink-0 flex-col gap-0.5 border-r border-border/60 p-2">
        <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Quick ranges
        </p>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              const [f, t] = p.range();
              setDraftFrom(f);
              setDraftTo(t);
            }}
            className="rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <div className="flex flex-1 justify-around text-sm font-semibold text-foreground">
            {months.map((mo) => (
              <span key={`${mo.year}-${mo.month}`}>
                {new Date(mo.year, mo.month, 1).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex gap-4">
          {months.map((mo) => (
            <div key={`grid-${mo.year}-${mo.month}`} className="w-[15rem]">
              <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="py-1">
                    {w}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {mo.cells.map((cell, i) => {
                  if (!cell) return <span key={i} aria-hidden />;
                  const key = toDateKey(cell);
                  const selected = inRange(key);
                  const isStart = key === draftFrom;
                  const isEnd = Boolean(draftFrom) && key === (draftTo || draftFrom);
                  const isEndpoint = isStart || isEnd;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDayClick(cell)}
                      className={cn(
                        "flex h-8 items-center justify-center text-xs transition-colors",
                        selected ? "bg-primary/10" : "hover:bg-muted",
                        isStart && "rounded-l-lg",
                        isEnd && "rounded-r-lg",
                        !selected && "rounded-lg",
                        isEndpoint
                          ? "bg-primary font-semibold text-primary-foreground hover:bg-primary"
                          : selected
                            ? "text-foreground"
                            : key === todayKey
                              ? "font-semibold text-primary"
                              : "text-foreground/80",
                      )}
                      aria-label={key}
                      aria-pressed={selected}
                    >
                      {cell.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-xs text-muted-foreground">
            {formatDateRange(draftFrom, draftTo || draftFrom)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => onApply(draftFrom, draftTo || draftFrom)}
              disabled={!draftFrom}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DateRangeFilter({
  from,
  to,
  onChange,
  ariaLabel = "Filter jobs by posted date",
}: DateRangeFilterProps) {
  const hasActive = Boolean(from || to);

  return (
    <Popover
      align="end"
      panelClassName="overflow-hidden rounded-2xl relative"
      button={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted hover:text-foreground",
            hasActive ? "border-primary/40 text-foreground" : "border-border/80 text-muted-foreground",
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={ariaLabel}
        >
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          <span className="max-w-[14rem] truncate">{formatDateRange(from, to)}</span>
        </button>
      )}
    >
      {({ close }) => (
        <RangePanel
          from={from}
          to={to}
          onApply={(f, t) => {
            onChange(f, t);
            close();
          }}
          onClear={() => {
            onChange("", "");
            close();
          }}
        />
      )}
    </Popover>
  );
}
