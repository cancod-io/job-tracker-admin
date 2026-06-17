import { ShieldAlert } from "lucide-react";
import { AdminScamUrlsList } from "@/components/admin/admin-scam-urls-list";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminScamUrlsPage() {
  return (
    <RequirePermission permission="scam_urls.read" title="Block Lists">
      <div className="space-y-6">
        <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Block Lists
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage Block Lists. Jobs from these URLs will be removed and never added.
          </p>
        </header>
        <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="size-4 shrink-0 text-primary" aria-hidden />
            <span>Scam URL list, search, filters, and management actions</span>
          </div>
          <AdminScamUrlsList />
        </div>
      </div>
    </RequirePermission>
  );
}
