import { KeyRound } from "lucide-react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { SecureCredentialsPanel } from "@/components/admin/secure-credentials/secure-credentials-panel";

export default function SecureCredentialsPage() {
  return (
    <RequireAdmin title="Credentials">
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 shrink-0 text-primary" aria-hidden />
            <h1 className="text-lg font-semibold text-foreground">Credentials</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage credentials across all users. Secrets are write-only and never returned
            by the API. Administrators only.
          </p>
        </div>
        <SecureCredentialsPanel />
      </div>
    </RequireAdmin>
  );
}
