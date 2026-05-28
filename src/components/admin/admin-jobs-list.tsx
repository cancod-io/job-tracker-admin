"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/http";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { JobAtsStatus, JobListItem, JobListResponse, JobListSort } from "@/types/job-api";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const TRACKING_STORAGE_KEY = "shopify-job-tracker:application-progress:v1";
const PIPELINE_STATUSES: Exclude<JobAtsStatus, "rejected" | "archived">[] = [
  "new",
  "shortlisted",
  "applied",
  "interviewing",
  "offer",
];
const TRACKABLE_STATUSES: Exclude<JobAtsStatus, "archived">[] = [
  "new",
  "shortlisted",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];
const VIEW_OPTIONS = [
  { value: "all", label: "All jobs" },
  { value: "my", label: "My Applications" },
  { value: "archived", label: "Archived" },
] as const;

type ApplicationView = (typeof VIEW_OPTIONS)[number]["value"];

type JobTrackingRecord = {
  status?: JobAtsStatus;
  notes?: string;
  archivedAt?: string;
  updatedAt?: string;
};

type JobTrackingState = Record<string, JobTrackingRecord>;

type TrackedJob = {
  job: JobListItem;
  status: JobAtsStatus;
  notes: string;
  archivedAt?: string;
  updatedAt?: string;
};

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

function isJobAtsStatus(value: unknown): value is JobAtsStatus {
  return (
    value === "new" ||
    value === "shortlisted" ||
    value === "applied" ||
    value === "interviewing" ||
    value === "offer" ||
    value === "rejected" ||
    value === "archived"
  );
}

function normalizeAtsStatus(value: unknown): JobAtsStatus {
  return isJobAtsStatus(value) ? value : "new";
}

function readTrackingState(): JobTrackingState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, Partial<JobTrackingRecord>>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, record]) => record && typeof record === "object")
        .map(([jobId, record]) => [
          jobId,
          {
            status: isJobAtsStatus(record.status) ? record.status : undefined,
            notes: typeof record.notes === "string" ? record.notes : undefined,
            archivedAt: typeof record.archivedAt === "string" ? record.archivedAt : undefined,
            updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
          },
        ]),
    );
  } catch {
    return {};
  }
}

function statusProgress(status: JobAtsStatus): number {
  if (status === "rejected" || status === "archived") return 100;

  const index = PIPELINE_STATUSES.indexOf(status);
  if (index <= 0) return 8;

  return Math.round((index / (PIPELINE_STATUSES.length - 1)) * 100);
}

function hasApplicationActivity(job: TrackedJob): boolean {
  return job.status !== "new" || job.notes.trim().length > 0;
}

function PipelineProgress({ status }: { status: JobAtsStatus }) {
  const progress = statusProgress(status);
  const activeIndex = PIPELINE_STATUSES.indexOf(status as (typeof PIPELINE_STATUSES)[number]);
  const terminalClass =
    status === "rejected"
      ? "bg-destructive"
      : status === "archived"
        ? "bg-muted-foreground"
        : "bg-primary";

  return (
    <div
      className="space-y-2"
      aria-label={`Application pipeline progress: ${formatAtsStatus(status)}`}
    >
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", terminalClass)}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid grid-cols-5 gap-1 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {PIPELINE_STATUSES.map((step, index) => {
          const isComplete = status === "rejected" || status === "archived" || index <= activeIndex;
          return (
            <span
              key={step}
              className={cn(
                "truncate",
                isComplete && "text-foreground",
                step === status && status !== "new" && "text-primary",
              )}
            >
              {formatAtsStatus(step)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function AdminJobsList() {
  const { accessToken } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sort, setSort] = useState<JobListSort>("relevance");
  const [query, setQuery] = useState("");
  const [queryDraft, setQueryDraft] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [view, setView] = useState<ApplicationView>("all");
  const [tracking, setTracking] = useState<JobTrackingState>({});
  const [trackingHydrated, setTrackingHydrated] = useState(false);
  const [data, setData] = useState<JobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTracking(readTrackingState());
    setTrackingHydrated(true);
  }, []);

  useEffect(() => {
    if (!trackingHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(tracking));
  }, [tracking, trackingHydrated]);

  const load = useCallback(async () => {
    if (!accessToken) {
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
      const res = await fetchWithTimeout(apiUrl(`/api/v1/jobs?${params}`), {
        headers: { Authorization: `Bearer ${accessToken}` },
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
  }, [accessToken, page, pageSize, sort, query, includeInactive, includeDuplicates]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  useEffect(() => {
    if (data && page > totalPages) {
      setPage(totalPages);
    }
  }, [data, page, totalPages]);

  const trackedJobs = useMemo<TrackedJob[]>(() => {
    return (data?.items ?? []).map((job) => {
      const record = tracking[String(job.id)] ?? {};
      const sourceStatus = normalizeAtsStatus(job.ats_status);
      return {
        job,
        status: record.status ?? sourceStatus,
        notes: record.notes ?? "",
        archivedAt: record.archivedAt,
        updatedAt: record.updatedAt,
      };
    });
  }, [data?.items, tracking]);

  const visibleJobs = useMemo(() => {
    return trackedJobs.filter((job) => {
      if (view === "archived") return job.status === "archived";
      if (job.status === "archived") return false;
      if (view === "my") return hasApplicationActivity(job);
      return true;
    });
  }, [trackedJobs, view]);

  const viewCounts = useMemo(() => {
    return trackedJobs.reduce(
      (counts, job) => {
        if (job.status === "archived") {
          counts.archived += 1;
          return counts;
        }
        counts.all += 1;
        if (hasApplicationActivity(job)) counts.my += 1;
        return counts;
      },
      { all: 0, my: 0, archived: 0 },
    );
  }, [trackedJobs]);

  const pipelineCounts = useMemo(() => {
    return trackedJobs.reduce(
      (counts, job) => {
        counts[job.status] += 1;
        return counts;
      },
      {
        new: 0,
        shortlisted: 0,
        applied: 0,
        interviewing: 0,
        offer: 0,
        rejected: 0,
        archived: 0,
      } satisfies Record<JobAtsStatus, number>,
    );
  }, [trackedJobs]);

  const upsertTracking = useCallback((job: JobListItem, updates: JobTrackingRecord) => {
    setTracking((current) => {
      const key = String(job.id);
      const nextRecord: JobTrackingRecord = {
        ...current[key],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      if (nextRecord.status !== "archived") {
        delete nextRecord.archivedAt;
      }

      return {
        ...current,
        [key]: nextRecord,
      };
    });
  }, []);

  const updateStatus = useCallback(
    (job: JobListItem, status: JobAtsStatus) => {
      upsertTracking(job, {
        status,
        archivedAt: status === "archived" ? new Date().toISOString() : undefined,
      });
    },
    [upsertTracking],
  );

  const updateNotes = useCallback(
    (job: JobListItem, notes: string) => {
      upsertTracking(job, { notes });
    },
    [upsertTracking],
  );

  const applySearch = () => {
    setQuery(queryDraft.trim());
    setPage(1);
    setView("all");
  };

  if (!accessToken) {
    return (
      <div
        className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        role="status"
      >
        Sign in to load jobs. The jobs endpoint uses the{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
          Authorization: Bearer &lt;token&gt;
        </code>{" "}
        header (see{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
          GET /api/v1/jobs
        </code>{" "}
        in OpenAPI).
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground md:text-lg">
              Application pipeline
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track each role from discovery through offer, including notes and locally saved status
              updates.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[26rem]">
            {(["applied", "interviewing", "offer", "rejected"] as const).map((status) => (
              <div
                key={status}
                className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2"
              >
                <div className="text-lg font-semibold tabular-nums text-foreground">
                  {pipelineCounts[status]}
                </div>
                <div className="text-xs font-medium capitalize text-muted-foreground">
                  {formatAtsStatus(status)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 overflow-hidden rounded-full border border-border/70 bg-muted text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {PIPELINE_STATUSES.map((status) => (
            <div
              key={status}
              className="border-r border-border/70 px-2 py-1.5 text-center last:border-r-0"
            >
              <span className="tabular-nums text-foreground">{pipelineCounts[status]}</span>{" "}
              {formatAtsStatus(status)}
            </div>
          ))}
        </div>
      </section>

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
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
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
          <div className="flex rounded-xl border border-border/80 bg-card p-1">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  view === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => setView(option.value)}
              >
                {option.label}
                <span className="ml-1 tabular-nums">
                  {option.value === "all"
                    ? viewCounts.all
                    : option.value === "my"
                      ? viewCounts.my
                      : viewCounts.archived}
                </span>
              </button>
            ))}
          </div>
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

      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm md:p-4">
        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin motion-reduce:animate-none" aria-hidden />
            Loading jobs…
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground xl:col-span-2">
                {data?.items.length === 0
                  ? "No jobs match the current filters."
                  : view === "my"
                    ? "No applications have been started on this page yet. Update a status or add notes to begin tracking."
                    : view === "archived"
                      ? "No archived applications on this page."
                      : "No jobs match the selected view."}
              </div>
            ) : (
              visibleJobs.map(({ job, status, notes, archivedAt, updatedAt }) => {
                const notesId = `job-${job.id}-notes`;
                return (
                  <article
                    key={job.id}
                    className={cn(
                      "flex flex-col gap-4 rounded-xl border border-border/70 bg-background p-4 shadow-sm",
                      status === "archived" && "bg-muted/30 opacity-85",
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">{job.title}</h3>
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                              atsBadgeClass(status),
                            )}
                          >
                            {formatAtsStatus(status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                          {job.company}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{job.location ?? "Location TBD"}</span>
                          {job.is_remote ? <span className="text-primary">Remote</span> : null}
                          <span>{job.job_type ?? "Type TBD"}</span>
                          {job.experience_level ? <span>{job.experience_level}</span> : null}
                          {job.salary ? <span>{job.salary}</span> : null}
                        </div>
                      </div>
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        Apply
                        <ExternalLink className="size-3.5 opacity-70" aria-hidden />
                      </a>
                    </div>

                    <PipelineProgress status={status} />

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <label className="space-y-1 text-sm font-medium text-foreground">
                        Status update
                        <select
                          value={status}
                          onChange={(e) => updateStatus(job, e.target.value as JobAtsStatus)}
                          className="min-h-10 w-full rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground"
                        >
                          {status === "archived" ? (
                            <option value="archived">Archived</option>
                          ) : null}
                          {TRACKABLE_STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {formatAtsStatus(option)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {status === "rejected" ? (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/15"
                            onClick={() => updateStatus(job, "archived")}
                          >
                            <Archive className="size-3.5" aria-hidden />
                            Archive rejected role
                          </button>
                        ) : null}
                        {status === "archived" ? (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                            onClick={() => updateStatus(job, "rejected")}
                          >
                            <RotateCcw className="size-3.5" aria-hidden />
                            Restore to rejected
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <label
                      htmlFor={notesId}
                      className="space-y-1 text-sm font-medium text-foreground"
                    >
                      Notes
                      <textarea
                        id={notesId}
                        value={notes}
                        onChange={(e) => updateNotes(job, e.target.value)}
                        placeholder="Add follow-ups, referral context, recruiter names, or next steps…"
                        className="min-h-24 w-full resize-y rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      <span>
                        Relevance{" "}
                        <span className="font-semibold tabular-nums text-foreground">
                          {relevanceLabel(job.shopify_relevance_score)}
                        </span>
                      </span>
                      <span>Discovered {formatDateTime(job.discovered_at)}</span>
                      {updatedAt ? <span>Updated {formatDateTime(updatedAt)}</span> : null}
                      {archivedAt ? <span>Archived {formatDateTime(archivedAt)}</span> : null}
                      <span>{job.is_active ? "Active" : "Inactive"}</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
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
            <span className="mx-1 text-muted-foreground/50">·</span>
            <span className="tabular-nums">{visibleJobs.length}</span> shown in{" "}
            {VIEW_OPTIONS.find((v) => v.value === view)?.label}
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
