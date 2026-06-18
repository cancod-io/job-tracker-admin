"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteAdminJob, listAdminJobs, listJobApplicants } from "@/lib/admin-job-api";
import {
  deleteJobFetchRun,
  listFetchRuns,
  listJobSources,
  listJobsForFetchDiff,
} from "@/lib/admin-jobs-filter-api";
import { formatJobSourceLabel } from "@/lib/job-source-utils";
import { formatDateRange } from "@/lib/date-utils";
import { getPaginationMeta } from "@/lib/pagination-constants";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import { AdminJobDetailModal } from "@/components/admin/admin-job-detail-modal";
import { AdminJobRemoveConfirm } from "@/components/admin/admin-job-remove-confirm";
import { AdminApplicantDetailModal } from "@/components/admin/admin-applicant-detail-modal";
import { AdminFetchChangeBar } from "@/components/admin/jobs/admin-fetch-change-bar";
import { AdminJobFetchRunDeleteConfirm } from "@/components/admin/jobs/admin-job-fetch-run-delete-confirm";
import { AdminFetchRunsPanel } from "@/components/admin/jobs/admin-fetch-runs-panel";
import {
  AdminSourceFilter,
  ALL_JOB_SOURCES_VALUE,
} from "@/components/admin/jobs/admin-source-filter";
import { JobRow } from "@/components/admin/jobs/job-row";
import { JobsToolbar } from "@/components/admin/jobs/jobs-toolbar";
import type { ApplicantsState } from "@/components/admin/jobs/applicants-panel";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { DataTable } from "@/components/ui/data-table";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useToast } from "@/hooks/use-toast";
import type {
  AdminJobApplicant,
  AdminJobDetail,
  AdminJobListResponse,
} from "@/types/admin-job-api";
import type { ApiFetchChangeType, ApiFetchRun } from "@/types/api-fetch-runs";

const DEFAULT_PAGE_SIZE = 20;

/** The status shown in the job's STATUS column — the primary (first) applicant's stage. */
function representativeStatus(job: AdminJobDetail): string | null {
  return job.applicants_preview[0]?.status ?? null;
}

function toCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function emptyJobsMessage(args: {
  search: string;
  source: string;
  postedFrom: string;
  postedTo: string;
  fetchChange: ApiFetchChangeType | null;
  total: number;
}): string {
  if (args.fetchChange && args.total === 0) {
    return `No ${args.fetchChange} jobs in this fetch run. Try another change type or run.`;
  }
  if ((args.postedFrom || args.postedTo) && args.total === 0) {
    return `No jobs posted ${formatDateRange(args.postedFrom, args.postedTo).toLowerCase()}. Try widening the date range.`;
  }
  if (args.source && args.total === 0) {
    return `No jobs found for ${formatJobSourceLabel(args.source)}.`;
  }
  if (args.search.length > 0) {
    return "No jobs match the current filters.";
  }
  return "No jobs found.";
}

export function AdminJobsList() {
  const { accessToken } = useAuth();
  const { can } = useAdminPermissions();
  const canDeleteJobs = can("jobs.delete");
  const canViewApplications = can("applications.read");
  const { toast, setToast } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [postedFrom, setPostedFrom] = useState("");
  const [postedTo, setPostedTo] = useState("");
  const [source, setSource] = useState(ALL_JOB_SOURCES_VALUE);
  const [fetchRunId, setFetchRunId] = useState<number | null>(null);
  const [fetchChange, setFetchChange] = useState<ApiFetchChangeType | null>(null);

  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [fetchRuns, setFetchRuns] = useState<ApiFetchRun[]>([]);
  const [fetchRunsLoading, setFetchRunsLoading] = useState(false);
  const [fetchRunsRefreshKey, setFetchRunsRefreshKey] = useState(0);

  const [data, setData] = useState<AdminJobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<AdminJobDetail | null>(null);
  const [deletingFetchRun, setDeletingFetchRun] = useState<ApiFetchRun | null>(null);
  const [viewingJob, setViewingJob] = useState<AdminJobDetail | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<{
    job: AdminJobDetail;
    applicant: AdminJobApplicant;
  } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [applicantsById, setApplicantsById] = useState<Record<number, ApplicantsState>>({});

  const inDiffMode = Boolean(source && fetchChange);

  const load = useCallback(async () => {
    if (!accessToken) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = inDiffMode
        ? await listJobsForFetchDiff(accessToken, {
            page,
            page_size: pageSize,
            source,
            fetch_change: fetchChange!,
            fetch_run_id: fetchRunId ?? undefined,
            q: search,
            posted_from: postedFrom || undefined,
            posted_to: postedTo || undefined,
          })
        : await listAdminJobs(accessToken, {
            page,
            page_size: pageSize,
            q: search,
            sort_by: "created_at",
            sort_order: "desc",
            source: source || undefined,
            posted_from: postedFrom || undefined,
            posted_to: postedTo || undefined,
          });
      setData(body);
      setExpanded(new Set());
      setApplicantsById({});
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize, search, source, fetchRunId, fetchChange, inDiffMode, postedFrom, postedTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!accessToken) {
      setSourceOptions([]);
      return;
    }
    let cancelled = false;
    setSourcesLoading(true);
    void listJobSources(accessToken)
      .then((sources) => {
        if (!cancelled) setSourceOptions(sources);
      })
      .catch(() => {
        if (!cancelled) setSourceOptions([]);
      })
      .finally(() => {
        if (!cancelled) setSourcesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !source) {
      setFetchRuns([]);
      return;
    }
    let cancelled = false;
    setFetchRunsLoading(true);
    void listFetchRuns(accessToken, { source, page: 1, page_size: 50 })
      .then((body) => {
        if (!cancelled) setFetchRuns(body.items);
      })
      .catch(() => {
        if (!cancelled) setFetchRuns([]);
      })
      .finally(() => {
        if (!cancelled) setFetchRunsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, source, fetchRunsRefreshKey]);

  const reloadFetchRuns = useCallback(() => {
    setFetchRunsRefreshKey((k) => k + 1);
  }, []);

  const activeFetchRun = useMemo(() => {
    if (!fetchChange || fetchRuns.length === 0) return null;
    if (fetchRunId != null) {
      return fetchRuns.find((run) => run.id === fetchRunId) ?? fetchRuns[0] ?? null;
    }
    return fetchRuns[0] ?? null;
  }, [fetchChange, fetchRunId, fetchRuns]);

  const timelineSelectedRunId = fetchRunId ?? activeFetchRun?.id ?? null;

  const { paginationTotal, currentPage, totalPages } = getPaginationMeta(data, page, pageSize);

  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  const visibleJobs = data?.items ?? [];

  const applySearch = () => {
    setSearch(searchDraft.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setSearchDraft("");
    setSearch("");
    setPage(1);
  };

  const handleSourceChange = (next: string) => {
    setSource(next);
    setFetchRunId(null);
    setFetchChange(null);
    setPage(1);
  };

  const handleSelectRun = (run: ApiFetchRun) => {
    setFetchRunId(run.id);
    setFetchChange("added");
    setPage(1);
  };

  const handleClearDiff = () => {
    setFetchRunId(null);
    setFetchChange(null);
    setPage(1);
  };

  const handleFetchChange = (next: ApiFetchChangeType) => {
    setFetchChange(next);
    setPage(1);
  };

  const handlePostedDateChange = (from: string, to: string) => {
    setPostedFrom(from);
    setPostedTo(to);
    setPage(1);
  };

  const handleRefresh = useCallback(() => {
    const nextSearch = searchDraft.trim();
    if (nextSearch !== search) {
      setSearch(nextSearch);
      setPage(1);
      return;
    }
    void load();
  }, [searchDraft, search, load]);

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

  const handleDeleteFetchRun = async (run: ApiFetchRun) => {
    if (!accessToken) throw new Error("Not signed in.");
    await deleteJobFetchRun(accessToken, run.id);
    if (fetchRunId === run.id) {
      setFetchRunId(null);
      setFetchChange(null);
    }
    setFetchRuns((prev) => prev.filter((r) => r.id !== run.id));
    setToast({ kind: "success", message: `Deleted fetch run #${run.id}.` });
    reloadFetchRuns();
    await load();
  };

  const handleExport = () => {
    const rows = visibleJobs;
    if (rows.length === 0) {
      setToast({ kind: "error", message: "Nothing to export on this page." });
      return;
    }
    const header = ["ID", "Job Title", "Company", "Location", "Status", "Applicants", "Posted", "Created"];
    const lines = rows.map((job) =>
      [
        String(job.id),
        job.job_title,
        job.company,
        job.location ?? "",
        representativeStatus(job) ?? "",
        String(job.applicants_total),
        job.posted_at ?? "",
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

  const filtersActive = search.length > 0 || source.length > 0 || inDiffMode;

  return (
    <div className="space-y-4">
      <AdminSourceFilter
        value={source}
        options={sourceOptions}
        loading={sourcesLoading}
        onChange={handleSourceChange}
      />

      {source ? (
        <AdminFetchRunsPanel
          source={source}
          runs={fetchRuns}
          loading={fetchRunsLoading}
          selectedRunId={timelineSelectedRunId}
          diffActive={inDiffMode}
          canDeleteRuns={canDeleteJobs}
          onSelectRun={handleSelectRun}
          onClearDiff={handleClearDiff}
          onDeleteRun={setDeletingFetchRun}
        />
      ) : null}

      {activeFetchRun && fetchChange ? (
        <AdminFetchChangeBar
          run={activeFetchRun}
          activeChange={fetchChange}
          onChange={handleFetchChange}
        />
      ) : null}

      <JobsToolbar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearch={applySearch}
        searchActive={search.length > 0 || searchDraft.length > 0}
        onClearSearch={clearSearch}
        postedFrom={postedFrom}
        postedTo={postedTo}
        onPostedDateChange={handlePostedDateChange}
        loading={loading}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />

      <ListNotifications toast={toast} error={error} />

      {data ? (
        <PaginationBar
          variant="top"
          shown={visibleJobs.length}
          total={paginationTotal}
          countLabel="jobs"
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

      <DataTable loading={loading && !data} loadingMessage="Loading jobs…" minWidth="920px">
        <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="min-w-[12rem] px-4 py-3 font-medium">Job Title</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Users (Applicants)</th>
            <th className="px-4 py-3 font-medium">Posted</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleJobs.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                {emptyJobsMessage({
                  search,
                  source,
                  postedFrom,
                  postedTo,
                  fetchChange,
                  total: paginationTotal,
                })}
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
      </DataTable>

      {data ? (
        <PaginationBar
          variant="bottom"
          shown={visibleJobs.length}
          total={paginationTotal}
          countLabel="jobs"
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

      {deletingFetchRun ? (
        <AdminJobFetchRunDeleteConfirm
          run={deletingFetchRun}
          onClose={() => setDeletingFetchRun(null)}
          onConfirm={() => handleDeleteFetchRun(deletingFetchRun)}
        />
      ) : null}
    </div>
  );
}
