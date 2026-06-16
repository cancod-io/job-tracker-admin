"use client";

import { Plus, Trash2 } from "lucide-react";
import { ListSearchInput } from "@/components/admin/shared/list-search-input";
import { RefreshButton } from "@/components/admin/shared/refresh-button";
import type { CompanyStatusFilter } from "@/types/company-api";

type CompaniesToolbarProps = {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearch: () => void;
  status: CompanyStatusFilter;
  onStatusChange: (status: CompanyStatusFilter) => void;
  filtersActive: boolean;
  onClearFilters: () => void;
  canManage: boolean;
  paginationTotal: number;
  loading: boolean;
  bulkDeleting: boolean;
  onAdd: () => void;
  onDeleteAll: () => void;
  onRefresh: () => void;
};

export function CompaniesToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearch,
  status,
  onStatusChange,
  filtersActive,
  onClearFilters,
  canManage,
  paginationTotal,
  loading,
  bulkDeleting,
  onAdd,
  onDeleteAll,
  onRefresh,
}: CompaniesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <ListSearchInput
          value={searchDraft}
          onChange={onSearchDraftChange}
          onSearch={onSearch}
          placeholder="Search by name or website…"
          ariaLabel="Search companies"
        />
        <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <span>Status</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as CompanyStatusFilter)}
            className="rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        {filtersActive ? (
          <button
            type="button"
            onClick={onClearFilters}
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
            Add Company
          </button>
        ) : null}
        {canManage && paginationTotal > 0 ? (
          <button
            type="button"
            onClick={onDeleteAll}
            disabled={bulkDeleting || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/15 disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden />
            Delete all
          </button>
        ) : null}
        <RefreshButton
          onClick={onRefresh}
          loading={loading}
          ariaLabel="Refresh companies"
        />
      </div>
    </div>
  );
}
