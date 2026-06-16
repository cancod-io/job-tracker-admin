"use client";

import { Pencil, Trash2 } from "lucide-react";
import { parseDomainParts } from "@/components/admin/career-urls/parse-domain-parts";
import { DataTable } from "@/components/ui/data-table";
import { ExternalLink } from "@/components/ui/external-link";
import { formatDateTime } from "@/lib/format-date";
import type { CareerUrl } from "@/types/career-url-api";

type CareerUrlsTableProps = {
  data: { items: CareerUrl[] } | null;
  loading: boolean;
  canManage: boolean;
  searchActive: boolean;
  onEdit: (row: CareerUrl) => void;
  onDelete: (row: CareerUrl) => void;
};

export function CareerUrlsTable({
  data,
  loading,
  canManage,
  searchActive,
  onEdit,
  onDelete,
}: CareerUrlsTableProps) {
  return (
    <DataTable loading={loading && !data} loadingMessage="Loading career URLs…" minWidth="900px">
      <thead className="border-b border-border/80 bg-muted/40 text-muted-foreground">
        <tr>
          <th className="px-4 py-3 font-medium">ID</th>
          <th className="px-4 py-3 font-medium">Career URL</th>
          <th className="px-4 py-3 font-medium">Domain</th>
          <th className="px-4 py-3 font-medium">Subdomain</th>
          <th className="px-4 py-3 font-medium">Created</th>
          <th className="px-4 py-3 font-medium">Updated</th>
          <th className="px-4 py-3 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {!data || data.items.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
              {searchActive
                ? "No career URLs match the current search."
                : "No career URLs yet. Add your first URL to get started."}
            </td>
          </tr>
        ) : (
          data.items.map((row) => {
            const { domain, subdomain } = parseDomainParts(row.career_url);
            return (
              <tr key={row.id} className="border-b border-border/60 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 align-middle tabular-nums text-muted-foreground">
                  {row.id}
                </td>
                <td className="px-4 py-3 align-middle">
                  <ExternalLink href={row.career_url} className="max-w-[24rem]">
                    {row.career_url}
                  </ExternalLink>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle text-muted-foreground">
                  {domain || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle">
                  {subdomain ? (
                    <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {subdomain}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle tabular-nums text-muted-foreground">
                  {formatDateTime(row.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle tabular-nums text-muted-foreground">
                  {formatDateTime(row.updated_at)}
                </td>
                <td className="px-4 py-3 align-middle text-right">
                  {canManage ? (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-muted"
                        aria-label={`Edit career URL #${row.id}`}
                        title="Edit"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive hover:bg-destructive/10"
                        aria-label={`Delete career URL #${row.id}`}
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
            );
          })
        )}
      </tbody>
    </DataTable>
  );
}
