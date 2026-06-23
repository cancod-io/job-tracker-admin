import { Link2 } from "lucide-react";
import { AdminCareerUrlsList } from "@/components/admin/admin-career-urls-list";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminCareerUrlsPage() {
  return (
    <RequirePermission permission="career_urls.read" title="Career URLs">
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Career URL list, search, pagination, and CRUD actions</span>
        </div>
        <AdminCareerUrlsList />
      </div>
    </RequirePermission>
  );
}
