import { Bell, BriefcaseBusiness, Sparkles } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8 md:shadow-soft">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5 shrink-0" aria-hidden />
            Remote hiring radar
          </span>
          <h1>Remote Shopify Job Tracker</h1>
          <p className="max-w-prose text-[0.9375rem] leading-relaxed">
            Monitor top remote opportunities, filter by role fit, and track every application
            outcome in one streamlined workflow.
          </p>
        </div>
        <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-none md:w-auto md:max-w-sm">
          <div className="rounded-xl border border-border/80 bg-background/80 px-4 py-3 shadow-sm">
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Active jobs
            </p>
            <div className="inline-flex items-center gap-2 text-lg font-semibold tabular-nums text-foreground">
              <BriefcaseBusiness className="size-4 shrink-0 text-primary" aria-hidden />
              148
            </div>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/80 px-4 py-3 shadow-sm">
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Alerts today
            </p>
            <div className="inline-flex items-center gap-2 text-lg font-semibold tabular-nums text-foreground">
              <Bell className="size-4 shrink-0 text-primary" aria-hidden />6 new
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
