import type { AnalyticsCountRow } from "@/types/admin-analytics-api";
import { cn } from "@/lib/utils";

const BAR_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-orange-500",
];

type AnalyticsBreakdownBarsProps = {
  title: string;
  rows: AnalyticsCountRow[];
  emptyMessage?: string;
  className?: string;
};

export function AnalyticsBreakdownBars({
  title,
  rows,
  emptyMessage = "No data for this range.",
  className,
}: AnalyticsBreakdownBarsProps) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <li key={row.key}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-foreground">{row.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{row.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/80">
                <div
                  className={cn("h-full rounded-full transition-all", BAR_COLORS[index % BAR_COLORS.length])}
                  style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type AnalyticsRankedTableProps = {
  title: string;
  rows: AnalyticsCountRow[];
  emptyMessage?: string;
};

export function AnalyticsRankedTable({
  title,
  rows,
  emptyMessage = "No data for this range.",
}: AnalyticsRankedTableProps) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[16rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 text-right font-medium">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-border/50 last:border-b-0">
                  <td className="py-2 pr-4 text-foreground">{row.label}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
