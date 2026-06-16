"use client";

import { MoreHorizontal, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  displayUrlHref,
  formatScamUrlType,
} from "@/components/admin/scam-urls/constants";
import { DataTable } from "@/components/ui/data-table";
import { ExternalLink } from "@/components/ui/external-link";
import { formatDateTime } from "@/lib/format-date";
import type { ScamUrl } from "@/types/scam-url-api";

type ScamUrlsTableProps = {
  items: ScamUrl[];
  loading: boolean;
  hasLoaded: boolean;
  canManage: boolean;
  filtersActive: boolean;
  searchActive: boolean;
  onEdit: (row: ScamUrl) => void;
  onDelete: (row: ScamUrl) => void;
  onAdd: () => void;
};

function TypeBadge({ type }: { type: ScamUrl["url_type"] }) {
  return (
    <span
      className={
        type === "domain"
          ? "inline-flex rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          : "inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
      }
    >
      {formatScamUrlType(type)}
    </span>
  );
}

function RowActions({
  row,
  canManage,
  onEdit,
  onDelete,
}: {
  row: ScamUrl;
  canManage: boolean;
  onEdit: (row: ScamUrl) => void;
  onDelete: (row: ScamUrl) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!canManage) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <>
      <div className="hidden justify-end gap-1 sm:flex">
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-muted"
          aria-label={`Edit scam URL ${row.url}`}
          title="Edit"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive hover:bg-destructive/10"
          aria-label={`Delete scam URL ${row.url}`}
          title="Delete"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-muted"
          aria-label={`Actions for ${row.url}`}
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </button>
        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10"
              aria-label="Close actions menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-1 min-w-[8rem] rounded-lg border border-border bg-card py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(row);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <Pencil className="size-4" aria-hidden />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(row);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function EmptyState({
  filtersActive,
  searchActive,
  canManage,
  onAdd,
}: {
  filtersActive: boolean;
  searchActive: boolean;
  canManage: boolean;
  onAdd: () => void;
}) {
  const message = filtersActive || searchActive
    ? "No scam URLs match the current search or filters."
    : "You haven't added any scam URLs yet.";

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <ShieldAlert className="size-7" aria-hidden />
      </div>
      <p className="text-base font-medium text-foreground">No scam URLs found</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {canManage && !filtersActive && !searchActive ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          Add Scam URL
        </button>
      ) : null}
    </div>
  );
}

export function ScamUrlsTable({
  items,
  loading,
  hasLoaded,
  canManage,
  filtersActive,
  searchActive,
  onEdit,
  onDelete,
  onAdd,
}: ScamUrlsTableProps) {
  const isEmpty = hasLoaded && items.length === 0;

  if (isEmpty && !loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <EmptyState
          filtersActive={filtersActive}
          searchActive={searchActive}
          canManage={canManage}
          onAdd={onAdd}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {loading && !hasLoaded ? (
          <DataTable loading loadingMessage="Loading scam URLs…">
            <tbody />
          </DataTable>
        ) : (
          items.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <ExternalLink href={displayUrlHref(row.url, row.url_type)} className="text-sm font-medium">
                    {row.url}
                  </ExternalLink>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <TypeBadge type={row.url_type} />
                    <span className="text-xs text-muted-foreground">{row.reason}</span>
                  </div>
                </div>
                <RowActions row={row} canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Added By</dt>
                  <dd className="font-medium text-foreground">{row.reported_by_name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Added At</dt>
                  <dd className="font-medium text-foreground">{formatDateTime(row.created_at)}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>

      <DataTable
        loading={loading && !hasLoaded}
        loadingMessage="Loading scam URLs…"
        minWidth="900px"
        className="hidden md:block"
      >
        <thead className="border-b border-border/80 bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">URL / Domain</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">Added By</th>
            <th className="px-4 py-3 font-medium">Added At</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 align-middle">
                <ExternalLink href={displayUrlHref(row.url, row.url_type)} className="max-w-[24rem]">
                  {row.url}
                </ExternalLink>
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-middle">
                <TypeBadge type={row.url_type} />
              </td>
              <td className="px-4 py-3 align-middle text-foreground">{row.reason}</td>
              <td className="hidden whitespace-nowrap px-4 py-3 align-middle text-muted-foreground lg:table-cell">
                {row.reported_by_name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-middle tabular-nums text-muted-foreground">
                {formatDateTime(row.created_at)}
              </td>
              <td className="px-4 py-3 align-middle text-right">
                <RowActions row={row} canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}
