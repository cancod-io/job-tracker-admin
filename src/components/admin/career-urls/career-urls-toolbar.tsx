"use client";

import { Plus } from "lucide-react";
import { ListSearchInput } from "@/components/admin/shared/list-search-input";
import { RefreshButton } from "@/components/admin/shared/refresh-button";

type CareerUrlsToolbarProps = {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearch: () => void;
  searchActive: boolean;
  onClearSearch: () => void;
  canManage: boolean;
  loading: boolean;
  onAdd: () => void;
  onRefresh: () => void;
};

export function CareerUrlsToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearch,
  searchActive,
  onClearSearch,
  canManage,
  loading,
  onAdd,
  onRefresh,
}: CareerUrlsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <ListSearchInput
          value={searchDraft}
          onChange={onSearchDraftChange}
          onSearch={onSearch}
          placeholder="Search career URLs…"
          ariaLabel="Search career URLs"
        />
        {searchActive ? (
          <button
            type="button"
            onClick={onClearSearch}
            className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canManage ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Career URL
          </button>
        ) : null}
        <RefreshButton
          onClick={onRefresh}
          loading={loading}
          ariaLabel="Refresh career URLs"
        />
      </div>
    </div>
  );
}
