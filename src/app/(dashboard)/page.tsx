import { AdminJobsList } from "@/components/admin/admin-jobs-list";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminOverviewPage() {
  return (
    <RequirePermission permission="jobs.read" title="Application Dashboard">
      <div className="space-y-6">
        <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Application Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Track role status, notes, archived rejections, and pipeline progress from the dashboard
            using your authenticated session token.
          </p>
        </header>
        <AdminJobsList />
      </div>
    </RequirePermission>
  );
}
