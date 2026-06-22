"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { KeyRound } from "lucide-react";
import {
  activateApiKey,
  createApiKey,
  deleteApiKey,
} from "@/lib/api-config-api";
import { AdminApiKeyDeleteConfirm } from "@/components/admin/admin-api-key-delete-confirm";
import { AdminApiKeyViewModal } from "@/components/admin/admin-api-key-view-modal";
import { ApiConfigAddKeyForm } from "@/components/admin/api-config/api-config-add-key-form";
import { ApiConfigKeysTable } from "@/components/admin/api-config/api-config-keys-table";
import { ApiConfigSourcesGrid } from "@/components/admin/api-config/api-config-sources-grid";
import { ApiConfigVaultToolbar } from "@/components/admin/api-config/api-config-vault-toolbar";
import {
  applyKeyActivation,
  sortApiKeysStable,
} from "@/components/admin/api-config/api-key-utils";
import type { ToastMessage } from "@/hooks/use-toast";
import type { ApiConfigResponse, ApiKeyCreateRequest, ApiKeyListItem } from "@/types/api-config-api";

type AdminApiConfigVaultPanelProps = {
  accessToken: string;
  canManage: boolean;
  config: ApiConfigResponse | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onConfigUpdate: Dispatch<SetStateAction<ApiConfigResponse | null>>;
  setToast: (toast: ToastMessage | null) => void;
};

export function AdminApiConfigVaultPanel({
  accessToken,
  canManage,
  config,
  loading,
  onRefresh,
  onConfigUpdate,
  setToast,
}: AdminApiConfigVaultPanelProps) {
  const [sourceFilter, setSourceFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<ApiKeyListItem | null>(null);
  const [deleting, setDeleting] = useState<ApiKeyListItem | null>(null);
  const [addFormSource, setAddFormSource] = useState<string | undefined>();

  const sources = config?.sources ?? [];
  const allKeys = useMemo(() => sortApiKeysStable(config?.keys ?? []), [config?.keys]);

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
      try {
        await onRefresh();
      } catch (refreshError) {
        setToast({
          kind: "error",
          message:
            refreshError instanceof Error
              ? `Key saved, but the vault list could not refresh: ${refreshError.message}`
              : "Key saved, but the vault list could not refresh.",
        });
      }
    } catch (e) {
      setToast({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to save API key.",
      });
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (key: ApiKeyListItem) => {
    if (!canManage) return;
    setActivatingId(key.id);
    try {
      const activated = await activateApiKey(accessToken, key.id);
      onConfigUpdate((prev) => (prev ? applyKeyActivation(prev, activated) : prev));
      setViewing((current) =>
        current?.id === activated.id ? { ...current, ...activated, is_active: true } : current,
      );
      setToast({ kind: "success", message: `${key.source_label} now uses this API key.` });
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
      if (viewing?.id === key.id) setViewing(null);
      try {
        await onRefresh();
      } catch (refreshError) {
        setToast({
          kind: "error",
          message:
            refreshError instanceof Error
              ? `Key deleted, but the vault list could not refresh: ${refreshError.message}`
              : "Key deleted, but the vault list could not refresh.",
        });
      }
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
          onView={setViewing}
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

      {viewing ? (
        <AdminApiKeyViewModal
          apiKey={viewing}
          onClose={() => setViewing(null)}
          onCopied={() => setToast({ kind: "success", message: "API key copied to clipboard." })}
          onCopyError={(message) => setToast({ kind: "error", message })}
        />
      ) : null}

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
