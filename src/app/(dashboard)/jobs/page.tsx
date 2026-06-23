import { AdminJobsList } from "@/components/admin/admin-jobs-list";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminJobsPage() {
  return (
    <RequirePermission permission="jobs.read" title="Jobs">
      <AdminJobsList />
    </RequirePermission>
  );
}
