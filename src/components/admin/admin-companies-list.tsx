"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toCompanyCreateRequest, toCompanyUpdatePatch } from "@/lib/company-form-api";
import {
  createCompany,
  deleteCompany,
  importCompaniesCsv,
  listAllCompanies,
  listCompanies,
  updateCompany,
} from "@/lib/company-api";
import { getPaginationMeta } from "@/lib/pagination-constants";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import { AdminCompanyFormModal } from "@/components/admin/admin-company-form-modal";
import { AdminCompanyDeleteConfirm } from "@/components/admin/admin-company-delete-confirm";
import { AdminCompanyCsvImportModal } from "@/components/admin/admin-company-csv-import-modal";
import { CompaniesTable } from "@/components/admin/companies/companies-table";
import { CompaniesToolbar } from "@/components/admin/companies/companies-toolbar";
import { AuthRequiredNotice } from "@/components/admin/shared/auth-required-notice";
import { BulkSelectionBar } from "@/components/admin/shared/bulk-selection-bar";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useRowSelection } from "@/hooks/use-row-selection";
import { useToast } from "@/hooks/use-toast";
import type {
  Company,
  CompanyFormPayload,
  CompanyFormUpdatePayload,
  CompanyListResponse,
  CompanyStatusFilter,
} from "@/types/company-api";

const DEFAULT_PAGE_SIZE = 10;

type DeleteConfirmState =
  | { mode: "selected"; companies: Company[] }
  | { mode: "all"; total: number; filtered: boolean };

export function AdminCompaniesList() {
  const { accessToken } = useAuth();
  const { can } = useAdminPermissions();
  const canManage = can("companies.manage");
  const { toast, setToast } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CompanyStatusFilter>("all");

  const [data, setData] = useState<CompanyListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<DeleteConfirmState | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showImport, setShowImport] = useState(false);

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

  const { paginationPageSize, paginationTotal, currentPage, totalPages } = getPaginationMeta(
    data,
    page,
    pageSize,
  );

  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  const pageItems = data?.items ?? [];
  const {
    selectedIds,
    allOnPageSelected,
    someOnPageSelected,
    selectedItems: selectedCompanies,
    toggleSelect,
    toggleSelectAllOnPage,
    clearSelection,
  } = useRowSelection(pageItems, [page, pageSize, search, status]);

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

  const handleCreate = async (payload: CompanyFormPayload | CompanyFormUpdatePayload) => {
    if (!accessToken) throw new Error("Not signed in.");
    const apiPayload = await toCompanyCreateRequest(accessToken, payload as CompanyFormPayload);
    await createCompany(accessToken, apiPayload);
    const name = typeof payload.name === "string" ? payload.name : "Company";
    setToast({ kind: "success", message: `Created “${name}”.` });
    setPage(1);
    await load();
  };

  const handleUpdate = async (id: number, payload: CompanyFormPayload | CompanyFormUpdatePayload) => {
    if (!accessToken) throw new Error("Not signed in.");
    const apiPayload = await toCompanyUpdatePatch(accessToken, payload as CompanyFormUpdatePayload);
    await updateCompany(accessToken, id, apiPayload);
    const name = typeof payload.name === "string" ? payload.name : "Company";
    setToast({ kind: "success", message: `Updated “${name}”.` });
    await load();
  };

  const handleDelete = async (companies: Company[]) => {
    if (!accessToken) throw new Error("Not signed in.");
    const results = await Promise.allSettled(
      companies.map((c) => deleteCompany(accessToken, c.id)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = companies.length - failed;

    if (succeeded > 0) {
      setToast({
        kind: failed > 0 ? "error" : "success",
        message:
          failed > 0
            ? `Deleted ${succeeded} of ${companies.length} companies. ${failed} failed.`
            : companies.length === 1
              ? `Deleted “${companies[0]?.name ?? "company"}”.`
              : `Deleted ${succeeded} companies.`,
      });
    }
    if (failed > 0 && succeeded === 0) {
      const firstError = results.find((r) => r.status === "rejected");
      throw new Error(
        firstError?.status === "rejected" && firstError.reason instanceof Error
          ? firstError.reason.message
          : "Delete failed.",
      );
    }

    clearSelection();
    await load();
  };

  const handleDeleteAll = async () => {
    if (!accessToken) throw new Error("Not signed in.");
    const all = await listAllCompanies(accessToken, { search, status });
    if (all.length === 0) {
      throw new Error("No companies to delete.");
    }
    await handleDelete(all);
  };

  const handleImport = useCallback(
    async (file: File) => {
      if (!accessToken) throw new Error("Not signed in.");
      const summary = await importCompaniesCsv(accessToken, file);
      setToast({
        kind: summary.failed > 0 ? "error" : "success",
        message:
          summary.failed > 0
            ? `Created ${summary.created}, updated ${summary.updated}, ${summary.failed} failed.`
            : `Created ${summary.created}, updated ${summary.updated}.`,
      });
      return summary;
    },
    [accessToken, setToast],
  );

  const filtersActive = useMemo(
    () => search.length > 0 || status !== "all",
    [search, status],
  );

  if (!accessToken) {
    return <AuthRequiredNotice resourceLabel="companies" />;
  }

  const rangeStart =
    paginationTotal === 0 ? 0 : (currentPage - 1) * paginationPageSize + 1;
  const rangeEnd = Math.min(
    paginationTotal,
    (currentPage - 1) * paginationPageSize + (data?.items.length ?? 0),
  );

  return (
    <div className="space-y-4">
      <CompaniesToolbar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearch={applySearch}
        status={status}
        onStatusChange={(next) => {
          setStatus(next);
          setPage(1);
        }}
        filtersActive={filtersActive}
        onClearFilters={clearFilters}
        canManage={canManage}
        paginationTotal={paginationTotal}
        loading={loading}
        bulkDeleting={bulkDeleting}
        onAdd={() => setShowCreate(true)}
        onDeleteAll={() =>
          setDeleting({
            mode: "all",
            total: paginationTotal,
            filtered: filtersActive,
          })
        }
        onRefresh={() => void load()}
      />

      <ListNotifications toast={toast} error={error} />

      {canManage && selectedIds.size > 0 ? (
        <BulkSelectionBar
          count={selectedIds.size}
          entityLabel="company"
          busy={bulkDeleting}
          onClear={clearSelection}
          onDelete={() => setDeleting({ mode: "selected", companies: selectedCompanies })}
        />
      ) : null}

      <CompaniesTable
        data={data}
        loading={loading}
        canManage={canManage}
        filtersActive={filtersActive}
        selectedIds={selectedIds}
        allOnPageSelected={allOnPageSelected}
        someOnPageSelected={someOnPageSelected}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAllOnPage}
        onEdit={setEditing}
        onDelete={(company) => setDeleting({ mode: "selected", companies: [company] })}
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
          companies={deleting.mode === "selected" ? deleting.companies : []}
          deleteAll={
            deleting.mode === "all"
              ? { total: deleting.total, filtered: deleting.filtered }
              : undefined
          }
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            setBulkDeleting(true);
            try {
              if (deleting.mode === "all") {
                await handleDeleteAll();
              } else {
                await handleDelete(deleting.companies);
              }
            } finally {
              setBulkDeleting(false);
            }
          }}
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
