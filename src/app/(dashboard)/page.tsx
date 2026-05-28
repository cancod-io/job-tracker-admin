import { AdminJobsList } from "@/components/admin/admin-jobs-list";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Application Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Track role status, notes, archived rejections, and pipeline progress from the dashboard.
        </p>
      </div>
      <AdminJobsList />
    </div>
  );
}
