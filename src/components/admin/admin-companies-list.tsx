"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createCompany,
  deleteCompany,
  exportCompaniesCsv,
  importCompaniesCsv,
  listCompanies,
  updateCompany,
} from "@/lib/company-api";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { AdminCompanyFormModal } from "@/components/admin/admin-company-form-modal";
import { AdminCompanyDeleteConfirm } from "@/components/admin/admin-company-delete-confirm";
import { AdminCompanyCsvImportModal } from "@/components/admin/admin-company-csv-import-modal";
import type {
  Company,
  CompanyCreateRequest,
  CompanyListResponse,
  CompanyStatusFilter,
  CompanyUpdatePatch,
} from "@/types/company-api";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

type Toast = { kind: "success" | "error"; message: string } | null;

export function AdminCompaniesList() {
  const { accessToken } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CompanyStatusFilter>("all");

  const [data, setData] = useState<CompanyListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const [exporting, setExporting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<Company | null>(null);
  const [showImport, setShowImport] = useState(false);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    if (!accessToken) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await listCompanies(accessToken, {
        page,
        page_size: pageSize,
        search,
        status,
      });
      setData(body);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const paginationPageSize = Math.max(1, data?.page_size ?? pageSize);
  const paginationTotal = Math.max(0, data?.total ?? 0);
  const currentPage = Math.max(1, data?.page ?? page);
  const totalPages = data ? Math.max(1, Math.ceil(paginationTotal / paginationPageSize)) : 1;

  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  const applySearch = () => {
    setSearch(searchDraft.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearchDraft("");
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  const handleCreate = async (payload: CompanyCreateRequest | CompanyUpdatePatch) => {
    if (!accessToken) throw new Error("Not signed in.");
    await createCompany(accessToken, payload as CompanyCreateRequest);
    const name = typeof payload.name === "string" ? payload.name : "Company";
    setToast({ kind: "success", message: `Created “${name}”.` });
    setPage(1);
    await load();
  };

  const handleUpdate = async (id: number, payload: CompanyCreateRequest | CompanyUpdatePatch) => {
    if (!accessToken) throw new Error("Not signed in.");
    await updateCompany(accessToken, id, payload as CompanyUpdatePatch);
    const name = typeof payload.name === "string" ? payload.name : "Company";
    setToast({ kind: "success", message: `Updated “${name}”.` });
    await load();
  };

  const handleDelete = async (company: Company) => {
    if (!accessToken) throw new Error("Not signed in.");
    await deleteCompany(accessToken, company.id);
    setToast({ kind: "success", message: `Deleted “${company.name}”.` });
    await load();
  };

  const handleExport = async () => {
    if (!accessToken) return;
    setExporting(true);
    try {
      const { blob, filename } = await exportCompaniesCsv(accessToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast({ kind: "success", message: `Exported ${filename}.` });
    } catch (e) {
      setToast({
        kind: "error",
        message: e instanceof Error ? e.message : "Export failed.",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = useCallback(
    async (file: File) => {
      if (!accessToken) throw new Error("Not signed in.");
      const summary = await importCompaniesCsv(accessToken, file);
      // Toast is informational here — the modal already shows the detailed summary.
      setToast({
        kind: summary.failed > 0 ? "error" : "success",
        message:
          summary.failed > 0
            ? `Created ${summary.created}, updated ${summary.updated}, ${summary.failed} failed.`
            : `Created ${summary.created}, updated ${summary.updated}.`,
      });
      return summary;
    },
    [accessToken],
  );

  const filtersActive = useMemo(
    () => search.length > 0 || status !== "all",
    [search, status],
  );

  if (!accessToken) {
    return (
      <div
        className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        role="status"
      >
        Sign in to manage companies. The companies endpoint uses the{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
          Authorization: Bearer &lt;token&gt;
        </code>{" "}
        header.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 gap-2">
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Search by name or website…"
              className="min-w-0 flex-1 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search companies"
            />
            <button
              type="button"
              onClick={applySearch}
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Search
            </button>
          </div>
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as CompanyStatusFilter);
                setPage(1);
              }}
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
              onClick={clearFilters}
              className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Upload className="size-4" aria-hidden />
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Company
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            aria-label="Refresh companies"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      {/* Toast / inline notifications */}
      {toast ? (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            toast.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
          role={toast.kind === "success" ? "status" : "alert"}
        >
          {toast.message}
        </p>
      ) : null}

      {error ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin motion-reduce:animate-none" aria-hidden />
            Loading companies…
          </div>
        ) : (
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border/80 bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Website URL</th>
                <th className="px-4 py-3 font-medium">Career Page URL</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">API Endpoint</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Last Scraped At</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    {filtersActive
                      ? "No companies match the current filters."
                      : "No companies yet. Add your first company or import a CSV to get started."}
                  </td>
                </tr>
              ) : (
                data.items.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 align-middle font-medium text-foreground">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <ExternalLinkCell url={c.website_url} />
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <ExternalLinkCell url={c.career_page_url} />
                    </td>
                    <td className="px-4 py-3 align-middle text-muted-foreground">
                      {c.scraping_method ?? "—"}
                    </td>
                    <td className="px-4 py-3 align-middle text-muted-foreground">
                      {c.api_endpoint ? <ExternalLinkCell url={c.api_endpoint} /> : "—"}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          c.is_active
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-middle text-muted-foreground tabular-nums">
                      {c.last_scraped_at ? formatDateTime(c.last_scraped_at) : "—"}
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(c)}
                          className="rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-muted"
                          aria-label={`Edit ${c.name}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(c)}
                          className="rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive hover:bg-destructive/10"
                          aria-label={`Delete ${c.name}`}
                          title="Delete"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data ? (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="tabular-nums">
              {paginationTotal === 0 ? 0 : (currentPage - 1) * paginationPageSize + 1}
            </span>{" "}
            to{" "}
            <span className="tabular-nums">
              {Math.min(paginationTotal, (currentPage - 1) * paginationPageSize + data.items.length)}
            </span>{" "}
            of <span className="tabular-nums">{paginationTotal}</span> results
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Per page
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-border/80 bg-card px-2 py-1.5 text-sm text-foreground"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-border/80 bg-card p-2 text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <span className="px-2 text-xs tabular-nums text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-border/80 bg-card p-2 text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      {showCreate ? (
        <AdminCompanyFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editing ? (
        <AdminCompanyFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => handleUpdate(editing.id, payload)}
        />
      ) : null}

      {deleting ? (
        <AdminCompanyDeleteConfirm
          company={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      ) : null}

      {showImport ? (
        <AdminCompanyCsvImportModal
          onClose={() => setShowImport(false)}
          onUpload={handleImport}
          onImported={() => void load()}
        />
      ) : null}
    </div>
  );
}

function ExternalLinkCell({ url }: { url: string | null }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-[18rem] truncate text-primary hover:underline"
      title={url}
    >
      {url}
    </a>
  );
}
