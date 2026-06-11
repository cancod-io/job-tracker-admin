"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  MapPin,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { deleteAdminJob, listAdminJobs, listJobApplicants } from "@/lib/admin-job-api";
import {
  applicantBadgeClass,
  avatarTint,
  formatApplicantStatus,
  initials,
} from "@/lib/applicant-status";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import { AdminJobDetailModal } from "@/components/admin/admin-job-detail-modal";
import { AdminJobRemoveConfirm } from "@/components/admin/admin-job-remove-confirm";
import { AdminApplicantDetailModal } from "@/components/admin/admin-applicant-detail-modal";
import { ApplicantAvatar } from "@/components/admin/applicant-avatar";
import type {
  AdminJobApplicant,
  AdminJobDetail,
  AdminJobListResponse,
} from "@/types/admin-job-api";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;
const PREVIEW_AVATARS = 4;

type Toast = { kind: "success" | "error"; message: string } | null;

type ApplicantsState = {
  loading: boolean;
  error: string | null;
  items: AdminJobApplicant[];
};

/** The status shown in the job's STATUS column — the primary (first) applicant's stage. */
function representativeStatus(job: AdminJobDetail): string | null {
  return job.applicants_preview[0]?.status ?? null;
}

function toCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function AdminJobsList() {
  const { accessToken } = useAuth();
  const { can } = useAdminPermissions();
  const canDeleteJobs = can("jobs.delete");
  const canViewApplications = can("applications.read");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState<AdminJobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const [deleting, setDeleting] = useState<AdminJobDetail | null>(null);
  const [viewingJob, setViewingJob] = useState<AdminJobDetail | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<{
    job: AdminJobDetail;
    applicant: AdminJobApplicant;
  } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [applicantsById, setApplicantsById] = useState<Record<number, ApplicantsState>>({});

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
      const body = await listAdminJobs(accessToken, {
        page,
        page_size: pageSize,
        q: search,
        sort_by: "created_at",
        sort_order: "desc",
      });
      setData(body);
      // A fresh page means stale expansions/applicant caches no longer apply.
      setExpanded(new Set());
      setApplicantsById({});
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load jobs.");
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

  const visibleJobs = data?.items ?? [];

  const applySearch = () => {
    setSearch(searchDraft.trim());
    setPage(1);
  };

  const loadApplicants = useCallback(
    async (jobId: number) => {
      if (!accessToken) return;
      setApplicantsById((prev) => ({
        ...prev,
        [jobId]: { loading: true, error: null, items: prev[jobId]?.items ?? [] },
      }));
      try {
        const body = await listJobApplicants(accessToken, jobId, { page_size: 200 });
        setApplicantsById((prev) => ({
          ...prev,
          [jobId]: { loading: false, error: null, items: body.items },
        }));
      } catch (e) {
        setApplicantsById((prev) => ({
          ...prev,
          [jobId]: {
            loading: false,
            error: e instanceof Error ? e.message : "Failed to load applicants.",
            items: prev[jobId]?.items ?? [],
          },
        }));
      }
    },
    [accessToken],
  );

  const toggleExpand = useCallback(
    (job: AdminJobDetail) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(job.id)) {
          next.delete(job.id);
        } else {
          next.add(job.id);
          if (!applicantsById[job.id]) void loadApplicants(job.id);
        }
        return next;
      });
    },
    [applicantsById, loadApplicants],
  );

  const handleDelete = async (job: AdminJobDetail) => {
    if (!accessToken) throw new Error("Not signed in.");
    await deleteAdminJob(accessToken, job.id);
    // Optimistically drop it from the current view, then reconcile with a reload.
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter((j) => j.id !== job.id),
            total: Math.max(0, prev.total - 1),
          }
        : prev,
    );
    setToast({ kind: "success", message: `Removed “${job.job_title}”.` });
    await load();
  };

  const handleExport = () => {
    const rows = visibleJobs;
    if (rows.length === 0) {
      setToast({ kind: "error", message: "Nothing to export on this page." });
      return;
    }
    const header = ["ID", "Job Title", "Company", "Location", "Status", "Applicants", "Created"];
    const lines = rows.map((job) =>
      [
        String(job.id),
        job.job_title,
        job.company,
        job.location ?? "",
        representativeStatus(job) ?? "",
        String(job.applicants_total),
        job.created_at,
      ]
        .map(toCsvCell)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobs-page-${currentPage}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast({ kind: "success", message: `Exported ${rows.length} jobs.` });
  };

  if (!accessToken) {
    return (
      <div
        className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        role="status"
      >
        Sign in to manage jobs. The admin jobs endpoint uses the{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
          Authorization: Bearer &lt;token&gt;
        </code>{" "}
        header (see{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
          GET /api/admin/jobs
        </code>
        ).
      </div>
    );
  }

  const filtersActive = search.length > 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            placeholder="Search by job title, company…"
            className="min-w-0 flex-1 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:max-w-md"
            aria-label="Search jobs"
          />
          <button
            type="button"
            onClick={applySearch}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Download className="size-4" aria-hidden />
            Export
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            aria-label="Refresh jobs"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Pagination (top) */}
      {data ? (
        <PaginationBar
          variant="top"
          shown={visibleJobs.length}
          total={paginationTotal}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          disablePrev={page <= 1 || loading}
          disableNext={page >= totalPages || loading}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin motion-reduce:animate-none" aria-hidden />
            Loading jobs…
          </div>
        ) : (
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="min-w-[12rem] px-4 py-3 font-medium">Job Title</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Users (Applicants)</th>
                <th className="px-4 py-3 font-medium">Created Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    {filtersActive ? "No jobs match the current filters." : "No jobs found."}
                  </td>
                </tr>
              ) : (
                visibleJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    expanded={expanded.has(job.id)}
                    applicants={applicantsById[job.id]}
                    canDelete={canDeleteJobs}
                    canViewApplications={canViewApplications}
                    onToggle={() => toggleExpand(job)}
                    onRetryApplicants={() => void loadApplicants(job.id)}
                    onViewDetail={() => setViewingJob(job)}
                    onRemove={() => setDeleting(job)}
                    onSelectApplicant={(applicant) => setSelectedApplicant({ job, applicant })}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination (bottom) */}
      {data ? (
        <PaginationBar
          variant="bottom"
          shown={visibleJobs.length}
          total={paginationTotal}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          disablePrev={page <= 1 || loading}
          disableNext={page >= totalPages || loading}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      ) : null}

      {viewingJob ? (
        <AdminJobDetailModal job={viewingJob} onClose={() => setViewingJob(null)} />
      ) : null}

      {selectedApplicant ? (
        <AdminApplicantDetailModal
          applicant={selectedApplicant.applicant}
          job={selectedApplicant.job}
          onClose={() => setSelectedApplicant(null)}
        />
      ) : null}

      {deleting ? (
        <AdminJobRemoveConfirm
          job={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      ) : null}
    </div>
  );
}

type PaginationBarProps = {
  variant: "top" | "bottom";
  shown: number;
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  disablePrev: boolean;
  disableNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (n: number) => void;
};

function PaginationBar({
  variant,
  shown,
  total,
  currentPage,
  totalPages,
  pageSize,
  disablePrev,
  disableNext,
  onPrev,
  onNext,
  onPageSizeChange,
}: PaginationBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        variant === "bottom" ? "border-t border-border/60 pt-4" : "border-b border-border/60 pb-4",
      )}
    >
      <p className="text-xs text-muted-foreground">
        Showing <span className="tabular-nums">{shown}</span> of{" "}
        <span className="tabular-nums">{total}</span> jobs
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
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
            disabled={disablePrev}
            onClick={onPrev}
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
            disabled={disableNext}
            onClick={onNext}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

type JobRowProps = {
  job: AdminJobDetail;
  expanded: boolean;
  applicants: ApplicantsState | undefined;
  canDelete: boolean;
  canViewApplications: boolean;
  onToggle: () => void;
  onRetryApplicants: () => void;
  onViewDetail: () => void;
  onRemove: () => void;
  onSelectApplicant: (applicant: AdminJobApplicant) => void;
};

function JobRow({
  job,
  expanded,
  applicants,
  canDelete,
  canViewApplications,
  onToggle,
  onRetryApplicants,
  onViewDetail,
  onRemove,
  onSelectApplicant,
}: JobRowProps) {
  const hasApplicants =
    canViewApplications && (job.applicants_total > 0 || job.applicants_preview.length > 0);

  return (
    <>
      <tr
        className={cn(
          "border-b border-border/60 align-top last:border-0",
          hasApplicants && "cursor-pointer transition-colors hover:bg-muted/30",
          expanded && "bg-muted/30",
        )}
        onClick={hasApplicants ? onToggle : undefined}
      >
        {/* Job details */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label={expanded ? "Collapse applicants" : "Expand applicants"}
              aria-expanded={expanded}
              disabled={!hasApplicants}
            >
              <ChevronDown
                className={cn("size-4 transition-transform", expanded && "rotate-180")}
                aria-hidden
              />
            </button>
            <div className="min-w-0">
              {/* <span className="text-xs font-medium text-muted-foreground">#{job.id}</span> */}
              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block max-w-[17rem] truncate font-semibold text-primary hover:underline"
                title={job.job_title}
              >
                {job.job_title}
              </a>
              {/* {job.location ? (
                <span className="mt-1 flex max-w-[17rem] items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{job.location}</span>
                </span>
              ) : null} */}
            </div>
          </div>
        </td>

        {/* Company */}
        <td className="px-4 py-4 align-middle">
          <div className="flex items-center gap-2">
            <CompanyLogo name={job.company} logoUrl={job.company_logo_url} />
            <span className="font-medium text-foreground">{job.company}</span>
          </div>
        </td>

        {/* Users (applicants) preview */}
        <td className="px-4 py-4 align-middle">
          {hasApplicants ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-muted"
              aria-label="View applicants"
            >
              <AvatarStack applicants={job.applicants_preview} total={job.applicants_total} />
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">No applicants</span>
          )}
        </td>

        {/* Created date */}
        <td className="whitespace-nowrap px-4 py-4 align-middle tabular-nums text-muted-foreground">
          {formatDateTime(job.created_at)}
        </td>

        {/* Actions */}
        <td className="px-4 py-4 text-right align-middle">
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Eye className="size-3.5" aria-hidden />
              Details
            </button>
            {canDelete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Remove
              </button>
            ) : null}
          </div>
        </td>
      </tr>

      {expanded && canViewApplications ? (
        <tr className="border-b border-border/60 bg-muted/20">
          <td colSpan={5} className="px-4 py-4">
            <div className="border-l-2 border-primary/20 pl-4">
              <ApplicantsPanel
                state={applicants}
                previewFallback={job.applicants_preview}
                onRetry={onRetryApplicants}
                onSelect={onSelectApplicant}
              />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function CompanyLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className="size-7 shrink-0 rounded-md object-contain"
        loading="lazy"
      />
    );
  }
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
        avatarTint(name),
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function AvatarStack({ applicants, total }: { applicants: AdminJobApplicant[]; total: number }) {
  const shown = applicants.slice(0, PREVIEW_AVATARS);
  const extra = Math.max(0, total - shown.length);
  return (
    <span className="flex items-center">
      <span className="flex -space-x-2">
        {shown.map((a) => (
          <ApplicantAvatar
            key={a.application_id}
            userId={a.user_id}
            name={a.full_name || a.email}
            profilePictureUrl={a.profile_picture_url}
            ring
            title={`${a.full_name} · ${formatApplicantStatus(a.status)}`}
          />
        ))}
      </span>
      {extra > 0 ? (
        <span className="ml-2 text-xs font-medium text-primary">+{extra} more</span>
      ) : null}
    </span>
  );
}

function ApplicantsPanel({
  state,
  previewFallback,
  onRetry,
  onSelect,
}: {
  state: ApplicantsState | undefined;
  previewFallback: AdminJobApplicant[];
  onRetry: () => void;
  onSelect: (applicant: AdminJobApplicant) => void;
}) {
  const loading = state?.loading ?? false;
  const error = state?.error ?? null;
  // Prefer the freshly-loaded full list; fall back to the inline preview rows.
  const rows = state && state.items.length > 0 ? state.items : previewFallback;

  return (
    <div className="rounded-xl border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Applicants for this job
        </h4>
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            Retry
          </button>
        </div>
      ) : loading && rows.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading applicants…
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No applicants for this job yet.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {rows.map((a) => (
            <li key={a.application_id}>
              <button
                type="button"
                onClick={() => onSelect(a)}
                className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left transition-colors hover:bg-muted/40 sm:gap-x-6"
              >
                <div className="flex min-w-[10rem] flex-1 items-center gap-2">
                  <ApplicantAvatar
                    userId={a.user_id}
                    name={a.full_name || a.email}
                    profilePictureUrl={a.profile_picture_url}
                  />
                  <span className="font-medium text-foreground">{a.full_name}</span>
                </div>
                <span className="min-w-[12rem] flex-1 text-sm text-muted-foreground">{a.email}</span>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    applicantBadgeClass(a.status),
                  )}
                >
                  {formatApplicantStatus(a.status)}
                </span>
                <span className="shrink-0 whitespace-nowrap tabular-nums text-sm text-muted-foreground">
                  {formatDateTime(a.applied_at ?? a.created_at)}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground">
                  <Eye className="size-3.5" aria-hidden />
                  View
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
