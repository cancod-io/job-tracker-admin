"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCareerUrl,
  deleteCareerUrl,
  listCareerUrls,
  updateCareerUrl,
} from "@/lib/career-url-api";
import { getPaginationMeta } from "@/lib/pagination-constants";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import { AdminCareerUrlDeleteConfirm } from "@/components/admin/admin-career-url-delete-confirm";
import { AdminCareerUrlFormModal } from "@/components/admin/admin-career-url-form-modal";
import { CareerUrlsTable } from "@/components/admin/career-urls/career-urls-table";
import { CareerUrlsToolbar } from "@/components/admin/career-urls/career-urls-toolbar";
import { AuthRequiredNotice } from "@/components/admin/shared/auth-required-notice";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useToast } from "@/hooks/use-toast";
import type {
  CareerUrl,
  CareerUrlCreateRequest,
  CareerUrlListResponse,
  CareerUrlUpdatePatch,
} from "@/types/career-url-api";

const DEFAULT_PAGE_SIZE = 20;

export function AdminCareerUrlsList() {
  const { accessToken } = useAuth();
  const { can } = useAdminPermissions();
  const canManage = can("career_urls.manage");
  const { toast, setToast } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState<CareerUrlListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CareerUrl | null>(null);
  const [deleting, setDeleting] = useState<CareerUrl | null>(null);

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

  const { paginationPageSize, paginationTotal, currentPage, totalPages } = getPaginationMeta(
    data,
    page,
    pageSize,
  );

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
    return <AuthRequiredNotice resourceLabel="career URLs" />;
  }

  const rangeStart =
    paginationTotal === 0 ? 0 : (currentPage - 1) * paginationPageSize + 1;
  const rangeEnd = Math.min(
    paginationTotal,
    (currentPage - 1) * paginationPageSize + (data?.items.length ?? 0),
  );

  return (
    <div className="space-y-4">
      <CareerUrlsToolbar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearch={applySearch}
        searchActive={searchActive}
        onClearSearch={clearSearch}
        canManage={canManage}
        loading={loading}
        onAdd={() => setShowCreate(true)}
        onRefresh={() => void load()}
      />

      <ListNotifications toast={toast} error={error} />

      <CareerUrlsTable
        data={data}
        loading={loading}
        canManage={canManage}
        searchActive={searchActive}
        onEdit={setEditing}
        onDelete={setDeleting}
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
