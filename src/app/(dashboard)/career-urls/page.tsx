import { Link2 } from "lucide-react";
import { AdminCareerUrlsList } from "@/components/admin/admin-career-urls-list";

export default function AdminCareerUrlsPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Career URLs
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage subdomain and career page URLs the scraper uses to locate job listings. Create,
          search, edit, and delete records via{" "}
          <code className="text-xs">/api/admin/career-urls</code>. Company relationships are not
          linked here yet — that will come later through{" "}
          <code className="text-xs">companies.related_id</code>.
        </p>
      </header>
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Career URL list, search, pagination, and CRUD actions</span>
        </div>
        <AdminCareerUrlsList />
      </div>
    </div>
  );
}
