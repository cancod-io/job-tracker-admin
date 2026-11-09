import { KeyRound } from "lucide-react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { SecureCredentialsPanel } from "@/components/admin/secure-credentials/secure-credentials-panel";

export default function SecureCredentialsPage() {
  return (
    <RequireAdmin title="Credentials">
      <div className="space-y-5">
        <SecureCredentialsPanel />
      </div>
    </RequireAdmin>
  );
}
