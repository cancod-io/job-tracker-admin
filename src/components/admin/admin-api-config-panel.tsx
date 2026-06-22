"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KeyRound, Loader2, SlidersHorizontal } from "lucide-react";
import { getApiConfig } from "@/lib/api-config-api";
import { withStableKeyOrder } from "@/components/admin/api-config/api-key-utils";
import { filterApiConfigResponse } from "@/components/admin/api-config/api-config-filters";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import { AdminApiConfigSettingsPanel } from "@/components/admin/admin-api-config-settings-panel";
import { AdminApiConfigVaultPanel } from "@/components/admin/admin-api-config-vault-panel";
import { AuthRequiredNotice } from "@/components/admin/shared/auth-required-notice";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ApiConfigResponse, ApiConfigTab } from "@/types/api-config-api";

const TABS: { id: ApiConfigTab; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
  { id: "keys", label: "Keys", icon: KeyRound },
];

export function AdminApiConfigPanel() {
  const { accessToken } = useAuth();
  const { can } = useAdminPermissions();
  const canRead = can("api_config.read");
  const canManage = can("api_config.manage");
  const { toast, setToast } = useToast();
  const [tab, setTab] = useState<ApiConfigTab>("settings");
  const [config, setConfig] = useState<ApiConfigResponse | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState<string | null>(null);
  const loadKeysRequestRef = useRef(0);

  const loadKeys = useCallback(async () => {
    if (!accessToken) return;
    const requestId = ++loadKeysRequestRef.current;
    setKeysLoading(true);
    setKeysError(null);
    try {
      const next = withStableKeyOrder(filterApiConfigResponse(await getApiConfig(accessToken)));
      if (requestId !== loadKeysRequestRef.current) return;
      setConfig(next);
    } catch (e) {
      if (requestId !== loadKeysRequestRef.current) return;
      setConfig(null);
      setKeysError(e instanceof Error ? e.message : "Failed to load API keys.");
    } finally {
      if (requestId === loadKeysRequestRef.current) {
        setKeysLoading(false);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    if (tab === "keys") void loadKeys();
  }, [tab, loadKeys]);

  if (!accessToken) {
    return <AuthRequiredNotice resourceLabel="API configuration" />;
  }

  if (!canRead) {
    return (
      <AlertBanner variant="warning">
        You do not have the <code className="text-xs">api_config.read</code> permission required to
        view API configuration.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap gap-2 border-b border-border/80 pb-1"
        role="tablist"
        aria-label="API configuration sections"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
              tab === id
                ? "border border-b-0 border-border/80 bg-card text-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Changes apply on the api-service&apos;s next config refresh or scrape run.
      </p>

      <ListNotifications toast={toast} error={tab === "keys" ? keysError : null} />

      {!canManage ? (
        <AlertBanner variant="warning">
          You have read-only access (<code className="text-xs">api_config.read</code>). Saving
          settings or managing keys requires <code className="text-xs">api_config.manage</code>.
        </AlertBanner>
      ) : null}

      {tab === "settings" ? (
        <AdminApiConfigSettingsPanel
          accessToken={accessToken}
          canManage={canManage}
          setToast={setToast}
        />
      ) : keysLoading && !config ? (
        <div
          className="flex min-h-[16rem] flex-col items-center justify-center gap-3 text-muted-foreground"
          aria-busy="true"
        >
          <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
          <p className="text-sm">Loading API keys…</p>
        </div>
      ) : (
        <AdminApiConfigVaultPanel
          accessToken={accessToken}
          canManage={canManage}
          config={config}
          loading={keysLoading}
          onRefresh={loadKeys}
          onConfigUpdate={setConfig}
          setToast={setToast}
        />
      )}
    </div>
  );
}
