"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createScamUrl,
  deleteScamUrl,
  listScamUrls,
  updateScamUrl,
} from "@/lib/scam-url-api";
import { getPaginationMeta } from "@/lib/pagination-constants";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import { AdminScamUrlDeleteConfirm } from "@/components/admin/admin-scam-url-delete-confirm";
import { AdminScamUrlFormModal } from "@/components/admin/admin-scam-url-form-modal";
import {
  applyScamUrlClientFilters,
  EMPTY_SCAM_URL_FILTERS,
  hasActiveClientFilters,
  type ScamUrlClientFilters,
} from "@/components/admin/scam-urls/apply-filters";
import { ScamUrlsTable } from "@/components/admin/scam-urls/scam-urls-table";
import { ScamUrlsToolbar } from "@/components/admin/scam-urls/scam-urls-toolbar";
import { AuthRequiredNotice } from "@/components/admin/shared/auth-required-notice";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useToast } from "@/hooks/use-toast";
import type {
  ScamUrl,
  ScamUrlCreateRequest,
  ScamUrlListResponse,
  ScamUrlType,
  ScamUrlUpdatePatch,
} from "@/types/scam-url-api";

const DEFAULT_PAGE_SIZE = 20;

export function AdminScamUrlsList() {
  const { accessToken } = useAuth();
  const { can } = useAdminPermissions();
  const canManage = can("scam_urls.manage");
  const { toast, setToast } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<ScamUrlType | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<ScamUrlClientFilters>(EMPTY_SCAM_URL_FILTERS);
  const [clientFilters, setClientFilters] = useState<ScamUrlClientFilters>(EMPTY_SCAM_URL_FILTERS);

  const [data, setData] = useState<ScamUrlListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ScamUrl | null>(null);
  const [deleting, setDeleting] = useState<ScamUrl | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await listScamUrls(accessToken, {
        page,
        page_size: pageSize,
        q: search || undefined,
      });
      setData(body);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load Block Lists.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const { paginationPageSize, paginationTotal, currentPage, totalPages } = getPaginationMeta(
    data,
    page,
    pageSize,
  );

  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  const effectiveFilters = useMemo<ScamUrlClientFilters>(
    () => ({
      ...clientFilters,
      urlType: typeFilter !== "all" ? typeFilter : clientFilters.urlType,
    }),
    [clientFilters, typeFilter],
  );

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return applyScamUrlClientFilters(data.items, effectiveFilters);
  }, [data, effectiveFilters]);

  const addedByOptions = useMemo(() => {
    if (!data) return [];
    const names = new Set(data.items.map((item) => item.reported_by_name).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const searchActive = search.length > 0;
  const filtersActive =
    hasActiveClientFilters(clientFilters) || typeFilter !== "all";

  const applySearch = () => {
    setSearch(searchDraft.trim());
    setPage(1);
  };

  const clearSearchAndFilters = () => {
    setSearchDraft("");
    setSearch("");
    setTypeFilter("all");
    setFilterDraft(EMPTY_SCAM_URL_FILTERS);
    setClientFilters(EMPTY_SCAM_URL_FILTERS);
    setPage(1);
  };

  const handleCreate = async (payload: ScamUrlCreateRequest | ScamUrlUpdatePatch) => {
    if (!accessToken) throw new Error("Not signed in.");
    const result = await createScamUrl(accessToken, payload as ScamUrlCreateRequest);
    const jobsMsg =
      result.removed_jobs > 0
        ? ` ${result.removed_jobs} matching job${result.removed_jobs === 1 ? "" : "s"} removed.`
        : "";
    setToast({ kind: "success", message: `Scam URL added successfully.${jobsMsg}` });
    setPage(1);
    await load();
  };

  const handleUpdate = async (id: number, payload: ScamUrlCreateRequest | ScamUrlUpdatePatch) => {
    if (!accessToken) throw new Error("Not signed in.");
    await updateScamUrl(accessToken, id, payload as ScamUrlUpdatePatch);
    setToast({ kind: "success", message: "Scam URL updated successfully." });
    await load();
  };

  const handleDelete = async (scamUrl: ScamUrl) => {
    if (!accessToken) throw new Error("Not signed in.");
    await deleteScamUrl(accessToken, scamUrl.id);
    setToast({ kind: "success", message: "Scam URL deleted successfully." });
    await load();
  };

  if (!accessToken) {
    return <AuthRequiredNotice resourceLabel="Block Lists" />;
  }

  const rangeStart =
    paginationTotal === 0 ? 0 : (currentPage - 1) * paginationPageSize + 1;
  const rangeEnd = Math.min(
    paginationTotal,
    (currentPage - 1) * paginationPageSize + (data?.items.length ?? 0),
  );

  return (
    <div className="space-y-4">
      <ScamUrlsToolbar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearch={applySearch}
        searchActive={searchActive}
        onClearSearch={clearSearchAndFilters}
        typeFilter={typeFilter}
        onTypeFilterChange={(type) => {
          setTypeFilter(type);
          setPage(1);
        }}
        filtersOpen={filtersOpen}
        onFiltersToggle={() => setFiltersOpen((v) => !v)}
        filtersActive={filtersActive}
        filterDraft={filterDraft}
        onFilterDraftChange={setFilterDraft}
        onApplyFilters={() => {
          setClientFilters(filterDraft);
          setPage(1);
        }}
        onResetFilters={() => {
          setFilterDraft(EMPTY_SCAM_URL_FILTERS);
          setClientFilters(EMPTY_SCAM_URL_FILTERS);
          setPage(1);
        }}
        addedByOptions={addedByOptions}
        canManage={canManage}
        loading={loading}
        onAdd={() => setShowCreate(true)}
        onRefresh={() => void load()}
      />

      <ListNotifications toast={toast} error={error} />

      <ScamUrlsTable
        items={filteredItems}
        loading={loading}
        hasLoaded={data != null}
        canManage={canManage}
        filtersActive={filtersActive}
        searchActive={searchActive}
        onEdit={setEditing}
        onDelete={setDeleting}
        onAdd={() => setShowCreate(true)}
      />

      {data ? (
        <PaginationBar
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
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

      {showCreate ? (
        <AdminScamUrlFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editing ? (
        <AdminScamUrlFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => handleUpdate(editing.id, payload)}
        />
      ) : null}

      {deleting ? (
        <AdminScamUrlDeleteConfirm
          scamUrl={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      ) : null}
    </div>
  );
}
