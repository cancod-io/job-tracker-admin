import { Building2 } from "lucide-react";
import { AdminCompaniesList } from "@/components/admin/admin-companies-list";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminCompaniesPage() {
  return (
    <RequirePermission permission="companies.read" title="Companies">
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Companies list, search, filter, pagination, and CSV import/export</span>
        </div>
        <AdminCompaniesList />
      </div>
    </RequirePermission>
  );
}
