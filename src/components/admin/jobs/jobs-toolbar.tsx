"use client";

import { Download } from "lucide-react";
import { ListSearchInput } from "@/components/admin/shared/list-search-input";
import { RefreshButton } from "@/components/admin/shared/refresh-button";

type JobsToolbarProps = {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  onExport: () => void;
  onRefresh: () => void;
};

export function JobsToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearch,
  loading,
  onExport,
  onRefresh,
}: JobsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <ListSearchInput
        value={searchDraft}
        onChange={onSearchDraftChange}
        onSearch={onSearch}
        placeholder="Search by job title, company…"
        ariaLabel="Search jobs"
        className="flex min-w-0 flex-1 gap-2 lg:max-w-md"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Download className="size-4" aria-hidden />
          Export
        </button>
        <RefreshButton onClick={onRefresh} loading={loading} ariaLabel="Refresh jobs" />
      </div>
    </div>
  );
}
