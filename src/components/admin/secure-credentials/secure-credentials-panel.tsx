"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Mail, Monitor, Plus, Shield } from "lucide-react";
import { SecureCredentialsDeleteConfirm } from "@/components/admin/secure-credentials/secure-credentials-delete-confirm";
import {
  SecureCredentialsFormDialog,
  type CredentialOwnerOption,
} from "@/components/admin/secure-credentials/secure-credentials-form-dialog";
import {
  SecureCredentialsTable,
  type VaultOwnerSummary,
} from "@/components/admin/secure-credentials/secure-credentials-table";
import {
  CREDENTIAL_TYPE_FILTER_OPTIONS,
  credentialTypeBadgeClass,
  formatCredentialType,
} from "@/components/admin/secure-credentials/constants";
import { AuthRequiredNotice } from "@/components/admin/shared/auth-required-notice";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { ListSearchInput } from "@/components/admin/shared/list-search-input";
import { RefreshButton } from "@/components/admin/shared/refresh-button";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useToast } from "@/hooks/use-toast";
import { listAdminUsers } from "@/lib/admin-user-api";
import { getPaginationMeta } from "@/lib/pagination-constants";
import {
  createSecureCredential,
  deleteSecureCredential,
  getSecureCredential,
  listSecureCredentials,
  updateSecureCredential,
} from "@/lib/secure-credentials-api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type {
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialListResponse,
  SecureCredentialUpdateRequest,
} from "@/types/secure-credentials";

const DEFAULT_PAGE_SIZE = 100;

const TYPE_ICONS: Record<CredentialType, typeof Monitor> = {
  pc_login: Monitor,
  gmail: Mail,
  outlook: Mail,
  company_email: Mail,
  two_fa_key: Shield,
  other: KeyRound,
};

export function SecureCredentialsPanel() {
  const { accessToken } = useAuth();
  const { toast, setToast } = useToast();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CredentialType | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState<number | "all">("all");

  const [data, setData] = useState<SecureCredentialListResponse | null>(null);
  const [ownerOptions, setOwnerOptions] = useState<CredentialOwnerOption[]>([]);
  const [ownerDirectory, setOwnerDirectory] = useState<VaultOwnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForOwnerId, setCreateForOwnerId] = useState<number | null>(null);
  const [editing, setEditing] = useState<SecureCredential | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleting, setDeleting] = useState<SecureCredential | null>(null);

  const loadOwners = useCallback(async () => {
    if (!accessToken) {
      setOwnerOptions([]);
      return;
    }
    try {
      const body = await listAdminUsers(accessToken, {
        page: 1,
        page_size: 200,
        is_active: true,
      });
      setOwnerOptions(
        body.items.map((user) => ({
          id: user.id,
          label: `${user.full_name} · ${user.email}`,
        })),
      );
    } catch {
      // Owner picker can still fall back to owners found in the vault list.
    }
  }, [accessToken]);

  /** Build people sidebar counts from a wide unscoped fetch when possible. */
  const refreshOwnerDirectory = useCallback(async () => {
    if (!accessToken) {
      setOwnerDirectory([]);
      return;
    }
    try {
      const body = await listSecureCredentials(accessToken, {
        page: 1,
        page_size: 200,
        q: search || undefined,
        credential_type: typeFilter === "all" ? undefined : typeFilter,
      });
      const map = new Map<number, VaultOwnerSummary>();
      for (const row of body.items) {
        if (row.owner_user_id <= 0) continue;
        const existing = map.get(row.owner_user_id);
        if (existing) {
          existing.count += 1;
          if (!existing.name && row.owner_name?.trim()) {
            existing.name = row.owner_name.trim();
          }
        } else {
          map.set(row.owner_user_id, {
            id: row.owner_user_id,
            name: row.owner_name?.trim() || `User #${row.owner_user_id}`,
            detail: `#${row.owner_user_id}`,
            count: 1,
          });
        }
      }
      setOwnerDirectory(
        Array.from(map.values()).sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        ),
      );
    } catch {
      // Sidebar can still use counts from the current page.
    }
  }, [accessToken, search, typeFilter]);

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
        owner_user_id: ownerFilter === "all" ? undefined : ownerFilter,
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
  }, [accessToken, page, pageSize, search, typeFilter, ownerFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadOwners();
  }, [loadOwners]);

  useEffect(() => {
    void refreshOwnerDirectory();
  }, [refreshOwnerDirectory]);

  const skipSearchPageReset = useRef(true);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchDraft.trim());
    }, 280);
    return () => window.clearTimeout(handle);
  }, [searchDraft]);

  useEffect(() => {
    if (skipSearchPageReset.current) {
      skipSearchPageReset.current = false;
      return;
    }
    setPage(1);
  }, [search]);

  const { paginationPageSize, paginationTotal, currentPage, totalPages } = getPaginationMeta(
    data,
    page,
    pageSize,
  );

  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  const mergedOwnerOptions = useMemo(() => {
    const byId = new Map<number, CredentialOwnerOption>();
    for (const option of ownerOptions) byId.set(option.id, option);
    for (const row of data?.items ?? []) {
      if (row.owner_user_id <= 0 || byId.has(row.owner_user_id)) continue;
      byId.set(row.owner_user_id, {
        id: row.owner_user_id,
        label: row.owner_name?.trim()
          ? `${row.owner_name.trim()} · #${row.owner_user_id}`
          : `User #${row.owner_user_id}`,
      });
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
  }, [ownerOptions, data?.items]);

  const sidebarOwners = useMemo(() => {
    if (ownerDirectory.length > 0) {
      const enriched = ownerDirectory.map((owner) => {
        const match = ownerOptions.find((o) => o.id === owner.id);
        if (!match) return owner;
        const email = match.label.includes(" · ")
          ? match.label.split(" · ").slice(1).join(" · ")
          : match.label;
        return {
          ...owner,
          name: match.label.split(" · ")[0] || owner.name,
          detail: email,
        };
      });
      return enriched;
    }

    const map = new Map<number, VaultOwnerSummary>();
    for (const row of data?.items ?? []) {
      if (row.owner_user_id <= 0) continue;
      const existing = map.get(row.owner_user_id);
      if (existing) existing.count += 1;
      else {
        map.set(row.owner_user_id, {
          id: row.owner_user_id,
          name: row.owner_name?.trim() || `User #${row.owner_user_id}`,
          detail: `#${row.owner_user_id}`,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [ownerDirectory, ownerOptions, data?.items]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<CredentialType, number>> = {};
    for (const row of data?.items ?? []) {
      counts[row.credential_type] = (counts[row.credential_type] ?? 0) + 1;
    }
    return counts;
  }, [data?.items]);

  const searchActive = search.length > 0;
  const filtersActive = typeFilter !== "all" || ownerFilter !== "all";

  const applySearch = () => {
    const next = searchDraft.trim();
    setSearchDraft(next);
    setSearch(next);
    setPage(1);
  };

  const clearSearchOnly = () => {
    setSearchDraft("");
    setSearch("");
    setPage(1);
  };

  const clearSearchAndFilters = () => {
    setSearchDraft("");
    setSearch("");
    setTypeFilter("all");
    setOwnerFilter("all");
    setPage(1);
  };

  const searchPending = searchDraft.trim() !== search;

  const openCreate = (ownerUserId?: number | null) => {
    setCreateForOwnerId(ownerUserId && ownerUserId > 0 ? ownerUserId : null);
    setShowCreate(true);
  };

  const handleCreate = async (
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => {
    if (!accessToken) throw new Error("Not signed in.");
    await createSecureCredential(accessToken, payload as SecureCredentialCreateRequest);
    setToast({ kind: "success", message: "Credential saved" });
    setPage(1);
    await Promise.all([load(), refreshOwnerDirectory()]);
  };

  const handleUpdate = async (
    id: number,
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => {
    if (!accessToken) throw new Error("Not signed in.");
    await updateSecureCredential(accessToken, id, payload as SecureCredentialUpdateRequest);
    setToast({ kind: "success", message: "Credential updated" });
    await Promise.all([load(), refreshOwnerDirectory()]);
  };

  const handleDelete = async (credential: SecureCredential) => {
    if (!accessToken) throw new Error("Not signed in.");
    await deleteSecureCredential(accessToken, credential.id);
    setToast({ kind: "success", message: "Credential deleted" });
    await Promise.all([load(), refreshOwnerDirectory()]);
  };

  const openEdit = async (row: SecureCredential) => {
    if (row.secret) {
      setEditing(row);
      return;
    }
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

  const rangeStart = paginationTotal === 0 ? 0 : (currentPage - 1) * paginationPageSize + 1;
  const rangeEnd = Math.min(
    paginationTotal,
    (currentPage - 1) * paginationPageSize + (data?.items.length ?? 0),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-muted/30 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <ListSearchInput
              value={searchDraft}
              onChange={setSearchDraft}
              onSearch={applySearch}
              onClear={clearSearchOnly}
              placeholder="Search service, type, person, email, username, notes…"
              ariaLabel="Search credentials"
              pending={searchPending}
              loading={loading && (searchActive || searchPending)}
              appliedQuery={search}
              resultCount={searchActive ? (data?.total ?? null) : null}
            />
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Filter by credential type"
            >
              {CREDENTIAL_TYPE_FILTER_OPTIONS.map((opt) => {
                const active = typeFilter === opt.value;
                const Icon =
                  opt.value === "all" ? KeyRound : TYPE_ICONS[opt.value as CredentialType];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTypeFilter(opt.value);
                      setPage(1);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/80 bg-card/80 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    aria-pressed={active}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {opt.label}
                  </button>
                );
              })}
              {filtersActive && !searchActive ? (
                <button
                  type="button"
                  onClick={clearSearchAndFilters}
                  className="px-2 text-xs font-semibold text-primary hover:underline"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <RefreshButton
              loading={loading}
              onClick={() => {
                void load();
                void refreshOwnerDirectory();
              }}
              ariaLabel="Refresh credentials"
            />
            <button
              type="button"
              onClick={() => openCreate(ownerFilter === "all" ? null : ownerFilter)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="size-4" aria-hidden />
              Add Credential
            </button>
          </div>
        </div>
      </div>

      <ListNotifications toast={toast} error={error} onDismissToast={() => setToast(null)} />

      <SecureCredentialsTable
        items={data?.items ?? []}
        owners={sidebarOwners}
        selectedOwnerId={ownerFilter}
        loading={loading}
        hasLoaded={data != null}
        filtersActive={filtersActive}
        searchActive={searchActive}
        onSelectOwner={(ownerId) => {
          setOwnerFilter(ownerId);
          setPage(1);
        }}
        onEdit={(row) => void openEdit(row)}
        onDelete={setDeleting}
        onAdd={() => openCreate()}
        onAddForOwner={(ownerUserId) => openCreate(ownerUserId)}
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
          ownerOptions={mergedOwnerOptions}
          preferredOwnerUserId={createForOwnerId}
          onClose={() => {
            setShowCreate(false);
            setCreateForOwnerId(null);
          }}
          onSubmit={handleCreate}
        />
      ) : null}

      {editing ? (
        <SecureCredentialsFormDialog
          mode="edit"
          initial={editing}
          ownerOptions={mergedOwnerOptions}
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
