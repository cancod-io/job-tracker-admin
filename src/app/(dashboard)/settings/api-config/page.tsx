import { Settings } from "lucide-react";
import { AdminApiConfigPanel } from "@/components/admin/admin-api-config-panel";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminApiConfigPage() {
  return (
    <RequirePermission permission="api_config.read" title="API Configuration">
      <div className="space-y-6">
        <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Settings
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            API Configuration
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage env settings (queries, limits, database URLs) and API keys for SerpAPI and
            Fantastic Jobs (ATS and Job Board). Both Fantastic sections share one API key.
          </p>
        </header>
        <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Settings className="size-4 shrink-0 text-primary" aria-hidden />
            <span>Env settings and API key vault — use the tabs below</span>
          </div>
          <AdminApiConfigPanel />
        </div>
      </div>
    </RequirePermission>
  );
}
