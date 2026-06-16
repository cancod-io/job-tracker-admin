"use client";

import { Plus } from "lucide-react";
import { ListSearchInput } from "@/components/admin/shared/list-search-input";
import { RefreshButton } from "@/components/admin/shared/refresh-button";
import {
  ScamUrlsFiltersButton,
  ScamUrlsFiltersPanel,
} from "@/components/admin/scam-urls/scam-urls-filters-panel";
import { SCAM_URL_TYPE_OPTIONS } from "@/components/admin/scam-urls/constants";
import type { ScamUrlClientFilters } from "@/components/admin/scam-urls/apply-filters";
import type { ScamUrlType } from "@/types/scam-url-api";

type ScamUrlsToolbarProps = {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearch: () => void;
  searchActive: boolean;
  onClearSearch: () => void;
  typeFilter: ScamUrlType | "all";
  onTypeFilterChange: (type: ScamUrlType | "all") => void;
  filtersOpen: boolean;
  onFiltersToggle: () => void;
  filtersActive: boolean;
  filterDraft: ScamUrlClientFilters;
  onFilterDraftChange: (filters: ScamUrlClientFilters) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  addedByOptions: string[];
  canManage: boolean;
  loading: boolean;
  onAdd: () => void;
  onRefresh: () => void;
};

export function ScamUrlsToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearch,
  searchActive,
  onClearSearch,
  typeFilter,
  onTypeFilterChange,
  filtersOpen,
  onFiltersToggle,
  filtersActive,
  filterDraft,
  onFilterDraftChange,
  onApplyFilters,
  onResetFilters,
  addedByOptions,
  canManage,
  loading,
  onAdd,
  onRefresh,
}: ScamUrlsToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <ListSearchInput
            value={searchDraft}
            onChange={onSearchDraftChange}
            onSearch={onSearch}
            placeholder="Search URL or domain…"
            ariaLabel="Search scam URLs"
          />
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
            <span className="sr-only sm:not-sr-only">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value as ScamUrlType | "all")}
              className="rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
              aria-label="Filter by type"
            >
              {SCAM_URL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div className="relative">
            <ScamUrlsFiltersButton
              filtersOpen={filtersOpen}
              filtersActive={filtersActive}
              onToggle={onFiltersToggle}
            />
            <ScamUrlsFiltersPanel
              open={filtersOpen}
              onClose={() => onFiltersToggle()}
              draft={filterDraft}
              onDraftChange={onFilterDraftChange}
              onApply={onApplyFilters}
              onReset={onResetFilters}
              addedByOptions={addedByOptions}
            />
          </div>
          {searchActive || typeFilter !== "all" ? (
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
              Add Scam URL
            </button>
          ) : null}
          <RefreshButton
            onClick={onRefresh}
            loading={loading}
            ariaLabel="Refresh scam URLs"
          />
        </div>
      </div>
    </div>
  );
}
