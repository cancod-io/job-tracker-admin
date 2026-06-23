import { Settings } from "lucide-react";
import { AdminApiConfigPanel } from "@/components/admin/admin-api-config-panel";
import { RequirePermission } from "@/components/admin/require-permission";

export default function AdminApiConfigPage() {
  return (
    <RequirePermission permission="api_config.read" title="API Configuration">
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Settings className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Env settings and API key vault — use the tabs below</span>
        </div>
        <AdminApiConfigPanel />
      </div>
    </RequirePermission>
  );
}
