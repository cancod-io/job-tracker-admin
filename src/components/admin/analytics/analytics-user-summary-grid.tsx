"use client";

import type { LucideIcon } from "lucide-react";
import { MailCheck, ShieldCheck, UserCheck, Users } from "lucide-react";
import {
  formatAnalyticsNumber,
  type UserSummaryQuadrant,
} from "@/lib/analytics-utils";
import { cn } from "@/lib/utils";

type QuadrantMeta = {
  icon: LucideIcon;
  iconClassName: string;
  accentClassName: string;
};

const QUADRANT_META: Record<string, QuadrantMeta> = {
  "By Role": {
    icon: Users,
    iconClassName: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    accentClassName: "border-violet-500/35",
  },
  "Approval Status": {
    icon: ShieldCheck,
    iconClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    accentClassName: "border-amber-500/35",
  },
  "Active Users": {
    icon: UserCheck,
    iconClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    accentClassName: "border-emerald-500/35",
  },
  "Email Verified": {
    icon: MailCheck,
    iconClassName: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    accentClassName: "border-sky-500/35",
  },
};

const ROW_BAR_COLORS: Record<string, string> = {
  Approved: "#10B981",
  Verified: "#10B981",
  "Active (30d)": "#10B981",
  Pending: "#F59E0B",
  Rejected: "#F43F5E",
  Unverified: "#94A3B8",
  "Inactive (30d)": "#94A3B8",
};

const DEFAULT_BAR_COLORS = ["#8B5CF6", "#6366F1", "#0EA5E9", "#14B8A6", "#F59E0B"] as const;

type AnalyticsUserSummaryGridProps = {
  quadrants: UserSummaryQuadrant[];
  columns?: 2 | 4;
  compact?: boolean;
};

function quadrantTotal(rows: UserSummaryQuadrant["rows"]): number {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

function rowBarColor(label: string, index: number): string {
  return ROW_BAR_COLORS[label] ?? DEFAULT_BAR_COLORS[index % DEFAULT_BAR_COLORS.length] ?? "#8B5CF6";
}

export function AnalyticsUserSummaryGrid({
  quadrants,
  columns = 2,
  compact = false,
}: AnalyticsUserSummaryGridProps) {
  if (quadrants.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No user summary data for this range.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        columns === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2",
      )}
    >
      {quadrants.map((quad) => {
        const meta = QUADRANT_META[quad.title] ?? {
          icon: Users,
          iconClassName: "bg-muted text-muted-foreground",
          accentClassName: "border-border/80",
        };
        const Icon = meta.icon;
        const total = quadrantTotal(quad.rows);

        return (
          <div
            key={quad.title}
            className={cn(
              "rounded-xl border bg-card/60 p-3 shadow-sm",
              meta.accentClassName,
              compact ? "border-l-[3px]" : "border-l-4",
            )}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                  meta.iconClassName,
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {quad.title}
              </p>
            </div>

            <ul className="space-y-2.5">
              {quad.rows.map((row, index) => {
                const share = total > 0 ? (row.count / total) * 100 : 0;
                const barColor = rowBarColor(row.label, index);

                return (
                  <li key={`${quad.title}-${row.label}`}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-muted-foreground">{row.label}</span>
                      <span className="shrink-0 tabular-nums font-semibold text-foreground">
                        {formatAnalyticsNumber(row.count)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(share > 0 ? 4 : 0, share)}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
