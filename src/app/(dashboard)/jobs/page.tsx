import { AdminJobsList } from "@/components/admin/admin-jobs-list";

export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Jobs</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage all job listings and their application status. Review applicants per job and remove
          listings via <code className="text-xs">GET /api/admin/jobs</code>.
        </p>
      </header>
      <AdminJobsList />
    </div>
  );
}
