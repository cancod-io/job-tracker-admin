import { ShieldAlert } from "lucide-react";
import { AdminScamUrlsList } from "@/components/admin/admin-scam-urls-list";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminScamUrlsPage() {
  return (
    <RequirePermission permission="scam_urls.read" title="Block Lists">
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Block Lists search, filters, and management actions</span>
        </div>
        <AdminScamUrlsList />
      </div>
    </RequirePermission>
  );
}
