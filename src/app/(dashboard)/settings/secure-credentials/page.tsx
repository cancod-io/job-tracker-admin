import { RequireAdmin } from "@/components/admin/require-admin";
import { SecureCredentialsPanel } from "@/components/admin/secure-credentials/secure-credentials-panel";

export default function SecureCredentialsPage() {
  return (
    <RequireAdmin title="Credentials">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Credentials
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manage every vault in one place — pick a person, filter by type, reveal or copy secrets,
            and edit without leaving the table.
          </p>
        </div>
        <SecureCredentialsPanel />
      </div>
    </RequireAdmin>
  );
}
