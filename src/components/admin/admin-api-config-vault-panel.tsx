"use client";

import { useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import {
  activateApiKey,
  createApiKey,
  deleteApiKey,
} from "@/lib/api-config-api";
import { AdminApiKeyDeleteConfirm } from "@/components/admin/admin-api-key-delete-confirm";
import { ApiConfigAddKeyForm } from "@/components/admin/api-config/api-config-add-key-form";
import { ApiConfigKeysTable } from "@/components/admin/api-config/api-config-keys-table";
import { ApiConfigSourcesGrid } from "@/components/admin/api-config/api-config-sources-grid";
import { ApiConfigVaultToolbar } from "@/components/admin/api-config/api-config-vault-toolbar";
import type { ToastMessage } from "@/hooks/use-toast";
import type { ApiConfigResponse, ApiKeyCreateRequest, ApiKeyListItem } from "@/types/api-config-api";

type AdminApiConfigVaultPanelProps = {
  accessToken: string;
  canManage: boolean;
  config: ApiConfigResponse | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  setToast: (toast: ToastMessage | null) => void;
};

export function AdminApiConfigVaultPanel({
  accessToken,
  canManage,
  config,
  loading,
  onRefresh,
  setToast,
}: AdminApiConfigVaultPanelProps) {
  const [sourceFilter, setSourceFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<ApiKeyListItem | null>(null);
  const [addFormSource, setAddFormSource] = useState<string | undefined>();

  const sources = config?.sources ?? [];
  const allKeys = config?.keys ?? [];

  const filteredKeys = useMemo(() => {
    if (sourceFilter === "all") return allKeys;
    return allKeys.filter((key) => key.source === sourceFilter);
  }, [allKeys, sourceFilter]);

  const handleSourceSelect = (sourceId: string) => {
    setSourceFilter((current) => (current === sourceId ? "all" : sourceId));
    setAddFormSource(sourceId);
  };

  const handleCreate = async (payload: ApiKeyCreateRequest) => {
    if (!canManage) return;
    setSubmitting(true);
    try {
      const created = await createApiKey(accessToken, payload);
      const sourceLabel =
        sources.find((source) => source.id === payload.source)?.label ?? payload.source;
      setToast({
        kind: "success",
        message: created.is_active
          ? `${sourceLabel} key saved and activated automatically.`
          : `${sourceLabel} key saved.`,
      });
      setSourceFilter(payload.source);
      await onRefresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save API key.";
      setToast({ kind: "error", message });
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (key: ApiKeyListItem) => {
    if (!canManage) return;
    setActivatingId(key.id);
    try {
      await activateApiKey(accessToken, key.id);
      setToast({ kind: "success", message: `${key.source_label} now uses this API key.` });
      await onRefresh();
    } catch (e) {
      setToast({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to activate API key.",
      });
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (key: ApiKeyListItem) => {
    if (!canManage) return;
    try {
      await deleteApiKey(accessToken, key.id);
      setToast({ kind: "success", message: "API key removed." });
      await onRefresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete API key.";
      setToast({ kind: "error", message });
      throw e;
    }
  };

  return (
    <div className="space-y-6">
      {canManage && sources.length > 0 ? (
        <ApiConfigAddKeyForm
          sources={sources}
          defaultSource={addFormSource ?? (sourceFilter === "all" ? undefined : sourceFilter)}
          submitting={submitting}
          onSubmit={handleCreate}
        />
      ) : null}

      <section className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm md:p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">API keys</h2>
            <p className="text-xs text-muted-foreground">
              Multiple keys per source — only one active key is used for scraping.
            </p>
          </div>
        </div>

        <ApiConfigVaultToolbar
          loading={loading}
          sourceFilter={sourceFilter}
          sources={sources}
          keyCount={filteredKeys.length}
          onSourceFilterChange={setSourceFilter}
          onRefresh={() => void onRefresh()}
        />

        <ApiConfigKeysTable
          keys={filteredKeys}
          loading={loading}
          hasLoaded={config !== null}
          canManage={canManage}
          sourceFilterActive={sourceFilter !== "all"}
          activatingId={activatingId}
          onActivate={(key) => void handleActivate(key)}
          onDelete={setDeleting}
        />
      </section>

      <ApiConfigSourcesGrid
        sources={sources}
        keys={allKeys}
        selectedSourceId={sourceFilter === "all" ? "" : sourceFilter}
        onSelectSource={handleSourceSelect}
      />

      {deleting ? (
        <AdminApiKeyDeleteConfirm
          apiKey={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      ) : null}
    </div>
  );
}
