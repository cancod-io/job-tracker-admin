import { Bell, BriefcaseBusiness, Sparkles } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="rounded-2xl border bg-card p-6 shadow-soft md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Clear UX Job Command Center
          </span>
          <h1>Remote Shopify Job Tracker</h1>
          <p className="max-w-2xl">
            Monitor top remote opportunities, filter by role fit, and track every application
            outcome in one streamlined workflow.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border bg-background px-4 py-3">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              Active Jobs
            </p>
            <div className="inline-flex items-center gap-2 font-semibold text-foreground">
              <BriefcaseBusiness className="size-4 text-accent" />
              148
            </div>
          </div>
          <div className="rounded-xl border bg-background px-4 py-3">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              Alerts Today
            </p>
            <div className="inline-flex items-center gap-2 font-semibold text-foreground">
              <Bell className="size-4 text-primary" />6 New
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
