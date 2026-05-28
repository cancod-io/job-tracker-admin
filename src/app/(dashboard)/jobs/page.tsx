import { AdminJobsList } from "@/components/admin/admin-jobs-list";

export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Jobs</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse scraped listings from <code className="text-xs">GET /api/v1/jobs</code>, then track
          application status, notes, archived rejections, and pipeline progress. Uses the dashboard{" "}
          <code className="text-xs">Authorization</code> bearer token.
        </p>
      </header>
      <AdminJobsList />
    </div>
  );
}
