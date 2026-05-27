"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/http";
import { cn } from "@/lib/utils";
import type { JobAtsStatus, JobListItem, JobListResponse, JobListSort } from "@/types/job-api";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function dashboardApiKey(): string | null {
  const k = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY?.trim();
  return k ? k : null;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function relevanceLabel(score: number | null): string {
  if (score == null) return "—";
  return `${Math.round(score * 1000) / 10}%`;
}

function atsBadgeClass(status: JobAtsStatus): string {
  switch (status) {
    case "new":
      return "bg-sky-500/15 text-sky-900 dark:text-sky-100 border-sky-500/30";
    case "shortlisted":
      return "bg-violet-500/15 text-violet-900 dark:text-violet-100 border-violet-500/30";
    case "applied":
      return "bg-blue-500/15 text-blue-900 dark:text-blue-100 border-blue-500/30";
    case "interviewing":
      return "bg-amber-500/15 text-amber-900 dark:text-amber-100 border-amber-500/30";
    case "offer":
      return "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 border-emerald-500/30";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/25";
    case "archived":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function formatAtsStatus(status: JobAtsStatus): string {
  return status.replace(/_/g, " ");
}

export function AdminJobsList() {
  const apiKey = useMemo(() => dashboardApiKey(), []);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sort, setSort] = useState<JobListSort>("relevance");
  const [query, setQuery] = useState("");
  const [queryDraft, setQueryDraft] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [data, setData] = useState<JobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!apiKey) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        sort,
        include_inactive: String(includeInactive),
        include_duplicates: String(includeDuplicates),
      });
      const q = query.trim();
      if (q) params.set("q", q);
      console.log(apiUrl(`/api/v1/jobs?${params}`), apiKey);
      const res = await fetchWithTimeout(apiUrl(`/api/v1/jobs?${params}`), {
        headers: { "X-API-Key": apiKey },
        credentials: "omit",
      });
      const body = (await res.json().catch(() => ({}))) as
        | JobListResponse
        | { error?: { code?: string; message?: string } };

      if (!res.ok) {
        const msg =
          "error" in body && body.error?.message
            ? body.error.message
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      setData(body as JobListResponse);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [apiKey, page, pageSize, sort, query, includeInactive, includeDuplicates]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  useEffect(() => {
    if (data && page > totalPages) {
      setPage(totalPages);
    }
  }, [data, page, totalPages]);

  const applySearch = () => {
    setQuery(queryDraft.trim());
    setPage(1);
  };

  if (!apiKey) {
    return (
      <div
        className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        role="status"
      >
        To load jobs, set{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
          NEXT_PUBLIC_DASHBOARD_API_KEY
        </code>{" "}
        in <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">.env.local</code> to match the
        dashboard API key configured on the server. The jobs endpoint uses the{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">X-API-Key</code> header (see{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">GET /api/v1/jobs</code> in OpenAPI).
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 gap-2">
            <input
              type="search"
              value={queryDraft}
              onChange={(e) => setQueryDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Search title, company, skills…"
              className="min-w-0 flex-1 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search jobs"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              onClick={() => applySearch()}
            >
              Search
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as JobListSort);
                setPage(1);
              }}
              className="rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setIncludeInactive(e.target.checked);
                setPage(1);
              }}
              className="rounded border-border"
            />
            Include inactive
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={includeDuplicates}
              onChange={(e) => {
                setIncludeDuplicates(e.target.checked);
                setPage(1);
              }}
              className="rounded border-border"
            />
            Include duplicates
          </label>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

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
            Loading jobs…
          </div>
        ) : (
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border/80 bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Type / level</th>
                <th className="px-4 py-3 font-medium">Relevance</th>
                <th className="px-4 py-3 font-medium">ATS</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Discovered</th>
                <th className="px-4 py-3 font-medium text-right">Link</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No jobs match the current filters.
                  </td>
                </tr>
              ) : (
                data?.items.map((job: JobListItem) => (
                  <tr key={job.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 align-middle">
                      <div className="font-medium text-foreground">{job.title}</div>
                      <div className="text-xs text-muted-foreground">{job.company}</div>
                      {job.salary ? (
                        <div className="mt-0.5 text-xs text-muted-foreground">{job.salary}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{job.location ?? "—"}</div>
                      {job.is_remote ? (
                        <span className="mt-1 inline-block text-xs text-primary">Remote</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{job.job_type ?? "—"}</div>
                      <div className="text-xs">{job.experience_level ?? ""}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                      {relevanceLabel(job.shopify_relevance_score)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                          atsBadgeClass(job.ats_status),
                        )}
                      >
                        {formatAtsStatus(job.ats_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{job.is_active ? "Yes" : "No"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground tabular-nums">
                      {formatDateTime(job.discovered_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        Apply
                        <ExternalLink className="size-3.5 opacity-70" aria-hidden />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {data ? (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Page <span className="tabular-nums">{data.page}</span> of{" "}
            <span className="tabular-nums">{totalPages}</span>
            <span className="mx-1 text-muted-foreground/50">·</span>
            <span className="tabular-nums">{data.items.length}</span> on this page,{" "}
            <span className="tabular-nums">{data.total}</span> total
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
    </div>
  );
}
