import { RequireAdmin } from "@/components/admin/require-admin";
import { LinksPanel } from "@/components/admin/links/links-panel";

export default function WebsiteLinksPage() {
  return (
    <RequireAdmin title="Links">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Links
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Shared website bookmarks — the same list users see. Sorted by display index.
          </p>
        </div>
        <LinksPanel />
      </div>
    </RequireAdmin>
  );
}
