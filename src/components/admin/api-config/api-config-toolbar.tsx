"use client";

import { Loader2, Save } from "lucide-react";
import { RefreshButton } from "@/components/admin/shared/refresh-button";

type ApiConfigToolbarProps = {
  loading: boolean;
  saving: boolean;
  canManage: boolean;
  onRefresh: () => void;
  onSave: () => void;
};

export function ApiConfigToolbar({
  loading,
  saving,
  canManage,
  onRefresh,
  onSave,
}: ApiConfigToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex flex-wrap items-center gap-2">
        <RefreshButton
          onClick={onRefresh}
          loading={loading}
          ariaLabel="Refresh API configuration"
        />
        {canManage ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
            Save changes
          </button>
        ) : null}
      </div>
    </div>
  );
}
