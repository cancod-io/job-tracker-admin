import { Building2 } from "lucide-react";
import { AdminCompaniesList } from "@/components/admin/admin-companies-list";

export default function AdminCompaniesPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Companies
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage the job companies the scraper polls. Create, edit, or delete entries, search by
          name or website, and bulk import / export via CSV. Connects to{" "}
          <code className="text-xs">/api/v1/admin/companies</code> with the dashboard{" "}
          <code className="text-xs">Authorization</code> bearer token.
        </p>
      </header>
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Companies list, search, filter, pagination, and CSV import/export</span>
        </div>
        <AdminCompaniesList />
      </div>
    </div>
  );
}
