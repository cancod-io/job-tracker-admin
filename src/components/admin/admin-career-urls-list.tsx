"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  createCareerUrl,
  deleteCareerUrl,
  listCareerUrls,
  updateCareerUrl,
} from "@/lib/career-url-api";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { AdminCareerUrlDeleteConfirm } from "@/components/admin/admin-career-url-delete-confirm";
import { AdminCareerUrlFormModal } from "@/components/admin/admin-career-url-form-modal";
import type {
  CareerUrl,
  CareerUrlCreateRequest,
  CareerUrlListResponse,
  CareerUrlUpdatePatch,
} from "@/types/career-url-api";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

type Toast = { kind: "success" | "error"; message: string } | null;

/** Best-effort parse of `apex.example.com` and the leading sub-portion. */
function parseDomainParts(rawUrl: string): { host: string; domain: string; subdomain: string } {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./i, "");
    const parts = host.split(".");
    if (parts.length <= 2) {
      return { host, domain: host, subdomain: "" };
    }
    // For `boards.greenhouse.io` → domain = greenhouse.io, subdomain = boards.
    // For `careers.acme.co.uk`  → domain = acme.co.uk,     subdomain = careers.
    // Heuristic: treat the last two labels as the registrable domain unless
    // the second-to-last is a common public-suffix segment (co / com / org / net / gov / ac / edu).
    const PUBLIC_SUFFIX_HINTS = new Set(["co", "com", "org", "net", "gov", "ac", "edu"]);
    const secondLast = parts[parts.length - 2] ?? "";
    const sliceFromEnd = PUBLIC_SUFFIX_HINTS.has(secondLast.toLowerCase()) ? 3 : 2;
    const domain = parts.slice(-sliceFromEnd).join(".");
    const subdomain = parts.slice(0, -sliceFromEnd).join(".");
    return { host, domain, subdomain };
  } catch {
    return { host: rawUrl, domain: rawUrl, subdomain: "" };
  }
}

export function AdminCareerUrlsList() {
  const { accessToken } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState<CareerUrlListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CareerUrl | null>(null);
  const [deleting, setDeleting] = useState<CareerUrl | null>(null);

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
      const body = await listCareerUrls(accessToken, {
        page,
        page_size: pageSize,
        q: search || undefined,
      });
      setData(body);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load career URLs.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize, search]);

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

  const clearSearch = () => {
    setSearchDraft("");
    setSearch("");
    setPage(1);
  };

  const handleCreate = async (payload: CareerUrlCreateRequest | CareerUrlUpdatePatch) => {
    if (!accessToken) throw new Error("Not signed in.");
    const created = await createCareerUrl(accessToken, payload as CareerUrlCreateRequest);
    setToast({ kind: "success", message: `Created career URL #${created.id}.` });
    setPage(1);
    await load();
  };

  const handleUpdate = async (id: number, payload: CareerUrlCreateRequest | CareerUrlUpdatePatch) => {
    if (!accessToken) throw new Error("Not signed in.");
    await updateCareerUrl(accessToken, id, payload as CareerUrlUpdatePatch);
    setToast({ kind: "success", message: `Updated career URL #${id}.` });
    await load();
  };

  const handleDelete = async (careerUrl: CareerUrl) => {
    if (!accessToken) throw new Error("Not signed in.");
    await deleteCareerUrl(accessToken, careerUrl.id);
    setToast({ kind: "success", message: `Deleted career URL #${careerUrl.id}.` });
    await load();
  };

  const searchActive = useMemo(() => search.length > 0, [search]);

  if (!accessToken) {
    return (
      <div
        className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        role="status"
      >
        Sign in to manage career URLs. The endpoint uses the{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
          Authorization: Bearer &lt;token&gt;
        </code>{" "}
        header.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 gap-2">
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Search career URLs…"
              className="min-w-0 flex-1 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search career URLs"
            />
            <button
              type="button"
              onClick={applySearch}
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Search
            </button>
          </div>
          {searchActive ? (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Career URL
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            aria-label="Refresh career URLs"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

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

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin motion-reduce:animate-none" aria-hidden />
            Loading career URLs…
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
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
                        <a
                          href={row.career_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-[24rem] items-center gap-1 truncate text-primary hover:underline"
                          title={row.career_url}
                        >
                          <span className="truncate">{row.career_url}</span>
                          <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        </a>
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
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(row)}
                            className="rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-muted"
                            aria-label={`Edit career URL #${row.id}`}
                            title="Edit"
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(row)}
                            className="rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive hover:bg-destructive/10"
                            aria-label={`Delete career URL #${row.id}`}
                            title="Delete"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

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

      {showCreate ? (
        <AdminCareerUrlFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editing ? (
        <AdminCareerUrlFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => handleUpdate(editing.id, payload)}
        />
      ) : null}

      {deleting ? (
        <AdminCareerUrlDeleteConfirm
          careerUrl={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      ) : null}
    </div>
  );
}
