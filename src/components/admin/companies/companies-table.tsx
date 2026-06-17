"use client";

import { Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ExternalLinkCell } from "@/components/ui/external-link";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { Company } from "@/types/company-api";

type CompaniesTableProps = {
  data: { items: Company[] } | null;
  loading: boolean;
  canManage: boolean;
  filtersActive: boolean;
  selectedIds: Set<number>;
  allOnPageSelected: boolean;
  someOnPageSelected: boolean;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
};

/** Fixed column widths — long name/URL truncate instead of stretching the table. */
const COL_NAME = "10rem";
const COL_URL = "14rem";

export function CompaniesTable({
  data,
  loading,
  canManage,
  filtersActive,
  selectedIds,
  allOnPageSelected,
  someOnPageSelected,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: CompaniesTableProps) {
  const pageItems = data?.items ?? [];
  const colSpan = canManage ? 5 : 4;

  return (
    <DataTable
      loading={loading && !data}
      loadingMessage="Loading companies…"
      minWidth="720px"
      tableClassName="table-fixed"
    >
      <colgroup>
        {canManage ? <col style={{ width: "2.5rem" }} /> : null}
        <col style={{ width: COL_NAME }} />
        <col style={{ width: COL_URL }} />
        <col style={{ width: "9rem" }} />
        <col style={{ width: "5.5rem" }} />
      </colgroup>
      <thead className="border-b border-border/80 bg-muted/40 text-muted-foreground">
        <tr>
          {canManage ? (
            <th className="px-4 py-3">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-primary"
                checked={allOnPageSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someOnPageSelected;
                }}
                onChange={onToggleSelectAll}
                disabled={pageItems.length === 0 || loading}
                aria-label="Select all companies on this page"
              />
            </th>
          ) : null}
          <th className="px-4 py-3 font-medium">Name</th>
          <th className="px-4 py-3 font-medium">Website URL</th>
          <th className="px-4 py-3 font-medium">Last Scraped At</th>
          <th className="px-4 py-3 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {!data || data.items.length === 0 ? (
          <tr>
            <td colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground">
              {filtersActive
                ? "No companies match the current filters."
                : "No companies yet. Add your first company or import a CSV to get started."}
            </td>
          </tr>
        ) : (
          data.items.map((company) => (
            <tr
              key={company.id}
              className={cn(
                "border-b border-border/60 last:border-0",
                selectedIds.has(company.id) && "bg-primary/5",
              )}
            >
              {canManage ? (
                <td className="px-4 py-3 align-middle">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-primary"
                    checked={selectedIds.has(company.id)}
                    onChange={() => onToggleSelect(company.id)}
                    aria-label={`Select ${company.name}`}
                  />
                </td>
              ) : null}
              <td className="max-w-0 px-4 py-3 align-middle">
                <span
                  className="block truncate font-medium text-foreground"
                  title={company.name}
                >
                  {company.name}
                </span>
              </td>
              <td className="max-w-0 px-4 py-3 align-middle">
                <ExternalLinkCell url={company.website_url} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-middle text-muted-foreground tabular-nums">
                {company.last_scraped_at ? formatDateTime(company.last_scraped_at) : "—"}
              </td>
              <td className="px-4 py-3 align-middle text-right">
                {canManage ? (
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(company)}
                      className="rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-muted"
                      aria-label={`Edit ${company.name}`}
                      title="Edit"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(company)}
                      className="rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive hover:bg-destructive/10"
                      aria-label={`Delete ${company.name}`}
                      title="Delete"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </DataTable>
  );
}
