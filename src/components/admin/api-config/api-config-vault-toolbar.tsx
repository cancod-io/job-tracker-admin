"use client";

import { RefreshButton } from "@/components/admin/shared/refresh-button";
import type { ApiConfigSource } from "@/types/api-config-api";

type ApiConfigVaultToolbarProps = {
  loading: boolean;
  sourceFilter: string;
  sources: ApiConfigSource[];
  keyCount: number;
  onSourceFilterChange: (source: string) => void;
  onRefresh: () => void;
};

export function ApiConfigVaultToolbar({
  loading,
  sourceFilter,
  sources,
  keyCount,
  onSourceFilterChange,
  onRefresh,
}: ApiConfigVaultToolbarProps) {
  const selectedLabel =
    sourceFilter === "all"
      ? "All sources"
      : (sources.find((source) => source.id === sourceFilter)?.label ?? sourceFilter);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">Filter vault</span>
          <select
            value={sourceFilter}
            onChange={(e) => onSourceFilterChange(e.target.value)}
            className="rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
            aria-label="Filter keys by source"
          >
            <option value="all">All sources</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted-foreground">
          {keyCount} {keyCount === 1 ? "key" : "keys"}
          {sourceFilter !== "all" ? ` · ${selectedLabel}` : ""}
        </p>
      </div>

      <RefreshButton
        onClick={onRefresh}
        loading={loading}
        ariaLabel="Refresh API configuration"
      />
    </div>
  );
}
