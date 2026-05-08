import { LayoutDashboard } from "lucide-react";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Use the sidebar to manage jobs, users, scrapers, and logs. Deep links update breadcrumbs
          above for quick orientation.
        </p>
      </div>
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Dashboard shell</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Navigation, protected routes, top bar, and breadcrumbs are wired. Replace this block
              with charts, queues, and KPIs as APIs become available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
