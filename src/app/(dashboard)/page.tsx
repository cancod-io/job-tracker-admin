import { AdminJobsList } from "@/components/admin/admin-jobs-list";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminOverviewPage() {
  return (
    <RequirePermission permission="jobs.read" title="Application Dashboard">
      <AdminJobsList />
    </RequirePermission>
  );
}
