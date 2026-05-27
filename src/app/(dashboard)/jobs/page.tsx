import { AdminJobsList } from "@/components/admin/admin-jobs-list";

export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Jobs</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse scraped listings from <code className="text-xs">GET /api/v1/jobs</code>: search, sort, paginate, and
          open apply links. Uses the dashboard <code className="text-xs">X-API-Key</code> header.
        </p>
      </header>
      <AdminJobsList />
    </div>
  );
}
