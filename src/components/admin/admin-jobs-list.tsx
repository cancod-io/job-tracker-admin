"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteAdminJob, listAdminJobs, listJobApplicants } from "@/lib/admin-job-api";
import { getPaginationMeta } from "@/lib/pagination-constants";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import { AdminJobDetailModal } from "@/components/admin/admin-job-detail-modal";
import { AdminJobRemoveConfirm } from "@/components/admin/admin-job-remove-confirm";
import { AdminApplicantDetailModal } from "@/components/admin/admin-applicant-detail-modal";
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

const DEFAULT_PAGE_SIZE = 20;

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
  const { toast, setToast } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState<AdminJobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<AdminJobDetail | null>(null);
  const [viewingJob, setViewingJob] = useState<AdminJobDetail | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<{
    job: AdminJobDetail;
    applicant: AdminJobApplicant;
  } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [applicantsById, setApplicantsById] = useState<Record<number, ApplicantsState>>({});

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
      <JobsToolbar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearch={applySearch}
        searchActive={filtersActive || searchDraft.length > 0}
        onClearSearch={clearSearch}
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
    </div>
  );
}
