"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { SecureCredentialsDeleteConfirm } from "@/components/admin/secure-credentials/secure-credentials-delete-confirm";
import { SecureCredentialsFormDialog } from "@/components/admin/secure-credentials/secure-credentials-form-dialog";
import { SecureCredentialsTable } from "@/components/admin/secure-credentials/secure-credentials-table";
import { CREDENTIAL_TYPE_FILTER_OPTIONS } from "@/components/admin/secure-credentials/constants";
import { AuthRequiredNotice } from "@/components/admin/shared/auth-required-notice";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { ListSearchInput } from "@/components/admin/shared/list-search-input";
import { RefreshButton } from "@/components/admin/shared/refresh-button";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useToast } from "@/hooks/use-toast";
import { getPaginationMeta } from "@/lib/pagination-constants";
import {
  createSecureCredential,
  deleteSecureCredential,
  getSecureCredential,
  listSecureCredentials,
  updateSecureCredential,
} from "@/lib/secure-credentials-api";
import { useAuth } from "@/providers/auth-provider";
import type {
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialListResponse,
  SecureCredentialUpdateRequest,
} from "@/types/secure-credentials";

const DEFAULT_PAGE_SIZE = 20;

export function SecureCredentialsPanel() {
  const { accessToken } = useAuth();
  const { toast, setToast } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [ownerDraft, setOwnerDraft] = useState("");
  const [ownerUserId, setOwnerUserId] = useState<number | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<CredentialType | "all">("all");

  const [data, setData] = useState<SecureCredentialListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SecureCredential | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleting, setDeleting] = useState<SecureCredential | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await listSecureCredentials(accessToken, {
        page,
        page_size: pageSize,
        q: search || undefined,
        credential_type: typeFilter === "all" ? undefined : typeFilter,
        owner_user_id: ownerUserId,
      });
      setData(body);
    } catch (e) {
      setData(null);
      const message = e instanceof Error ? e.message : "Failed to load credentials.";
      if (/403|forbidden|administrator/i.test(message)) {
        setError("Only administrators can manage credentials.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize, search, typeFilter, ownerUserId]);

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

  const searchActive = search.length > 0;
  const filtersActive = typeFilter !== "all" || ownerUserId != null;

  const applySearch = () => {
    setSearch(searchDraft.trim());
    const trimmedOwner = ownerDraft.trim();
    if (!trimmedOwner) {
      setOwnerUserId(undefined);
    } else {
      const parsed = Number(trimmedOwner);
      if (Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)) {
        setOwnerUserId(parsed);
      } else {
        setToast({ kind: "error", message: "Owner filter must be a positive user ID." });
        return;
      }
    }
    setPage(1);
  };

  const clearSearchAndFilters = () => {
    setSearchDraft("");
    setSearch("");
    setOwnerDraft("");
    setOwnerUserId(undefined);
    setTypeFilter("all");
    setPage(1);
  };

  const handleCreate = async (
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => {
    if (!accessToken) throw new Error("Not signed in.");
    await createSecureCredential(accessToken, payload as SecureCredentialCreateRequest);
    setToast({ kind: "success", message: "Credential saved" });
    setPage(1);
    await load();
  };

  const handleUpdate = async (
    id: number,
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => {
    if (!accessToken) throw new Error("Not signed in.");
    await updateSecureCredential(accessToken, id, payload as SecureCredentialUpdateRequest);
    setToast({ kind: "success", message: "Credential updated" });
    await load();
  };

  const handleDelete = async (credential: SecureCredential) => {
    if (!accessToken) throw new Error("Not signed in.");
    await deleteSecureCredential(accessToken, credential.id);
    setToast({ kind: "success", message: "Credential deleted" });
    await load();
  };

  const openEdit = async (row: SecureCredential) => {
    if (!accessToken) return;
    setEditLoading(true);
    try {
      const detail = await getSecureCredential(accessToken, row.id);
      setEditing(detail);
    } catch (e) {
      setToast({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to load credential.",
      });
    } finally {
      setEditLoading(false);
    }
  };

  if (!accessToken) {
    return <AuthRequiredNotice resourceLabel="Credentials" />;
  }

  const rangeStart =
    paginationTotal === 0 ? 0 : (currentPage - 1) * paginationPageSize + 1;
  const rangeEnd = Math.min(
    paginationTotal,
    (currentPage - 1) * paginationPageSize + (data?.items.length ?? 0),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <ListSearchInput
            value={searchDraft}
            onChange={setSearchDraft}
            onSearch={applySearch}
            placeholder="Search credentials…"
            ariaLabel="Search credentials"
          />
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
            <span className="sr-only sm:not-sr-only">Owner ID</span>
            <input
              type="number"
              min={1}
              step={1}
              value={ownerDraft}
              onChange={(e) => setOwnerDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Owner user ID"
              className="w-[8.5rem] rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              aria-label="Filter by owner user ID"
            />
          </label>
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
            <span className="sr-only sm:not-sr-only">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as CredentialType | "all");
                setPage(1);
              }}
              className="rounded-lg border border-border/80 bg-card px-2 py-2 text-sm text-foreground"
              aria-label="Filter by credential type"
            >
              {CREDENTIAL_TYPE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {searchActive || filtersActive ? (
            <button
              type="button"
              onClick={clearSearchAndFilters}
              className="text-sm font-medium text-primary hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            loading={loading}
            onClick={() => void load()}
            ariaLabel="Refresh credentials"
          />
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Credential
          </button>
        </div>
      </div>

      <ListNotifications toast={toast} error={error} onDismissToast={() => setToast(null)} />

      <SecureCredentialsTable
        items={data?.items ?? []}
        loading={loading}
        hasLoaded={data != null}
        filtersActive={filtersActive}
        searchActive={searchActive}
        onEdit={(row) => void openEdit(row)}
        onDelete={setDeleting}
        onAdd={() => setShowCreate(true)}
      />

      {editLoading ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
            <span
              className="inline-block size-4 animate-spin rounded-full border-2 border-muted border-t-primary"
              aria-hidden
            />
            Loading credential…
          </div>
        </div>
      ) : null}

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
        <SecureCredentialsFormDialog
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editing ? (
        <SecureCredentialsFormDialog
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => handleUpdate(editing.id, payload)}
        />
      ) : null}

      {deleting ? (
        <SecureCredentialsDeleteConfirm
          credential={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      ) : null}
    </div>
  );
}
