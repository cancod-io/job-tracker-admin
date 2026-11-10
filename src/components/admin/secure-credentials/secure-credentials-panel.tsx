"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Mail, Monitor, Plus, Search, Shield, Users } from "lucide-react";
import { EmployerFormDialog } from "@/components/admin/secure-credentials/employer-form-dialog";
import { SecureCredentialsDeleteConfirm } from "@/components/admin/secure-credentials/secure-credentials-delete-confirm";
import {
  SecureCredentialsFormDialog,
  type CredentialFormDefaults,
  type CredentialOwnerOption,
} from "@/components/admin/secure-credentials/secure-credentials-form-dialog";
import {
  SecureCredentialsTable,
  type VaultOwnerSummary,
} from "@/components/admin/secure-credentials/secure-credentials-table";
import {
  VaultTree,
  type VaultTreeSelection,
} from "@/components/admin/secure-credentials/vault-tree";
import { CREDENTIAL_TYPE_FILTER_OPTIONS } from "@/components/admin/secure-credentials/constants";
import { AuthRequiredNotice } from "@/components/admin/shared/auth-required-notice";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { ListSearchInput } from "@/components/admin/shared/list-search-input";
import { RefreshButton } from "@/components/admin/shared/refresh-button";
import { useToast } from "@/hooks/use-toast";
import { listAdminUsers } from "@/lib/admin-user-api";
import {
  createCredentialEmployer,
  deleteCredentialEmployer,
  listCredentialEmployers,
  updateCredentialEmployer,
} from "@/lib/credential-employers-api";
import {
  createSecureCredential,
  deleteSecureCredential,
  getCredentialTree,
  getSecureCredential,
  listSecureCredentials,
  updateSecureCredential,
} from "@/lib/secure-credentials-api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type {
  CredentialEmployer,
  CredentialEmployerCreateRequest,
  CredentialEmployerUpdateRequest,
  CredentialTreeResponse,
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialUpdateRequest,
} from "@/types/secure-credentials";

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

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CredentialType | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState<number | "all">("all");
  const [treeSelection, setTreeSelection] = useState<VaultTreeSelection>({ kind: "root" });
  const [peopleQuery, setPeopleQuery] = useState("");

  const [listItems, setListItems] = useState<SecureCredential[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [tree, setTree] = useState<CredentialTreeResponse | null>(null);
  const [employers, setEmployers] = useState<CredentialEmployer[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<CredentialOwnerOption[]>([]);
  const [ownerDirectory, setOwnerDirectory] = useState<VaultOwnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForOwnerId, setCreateForOwnerId] = useState<number | null>(null);
  const [createDefaults, setCreateDefaults] = useState<CredentialFormDefaults>({});
  const [editing, setEditing] = useState<SecureCredential | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleting, setDeleting] = useState<SecureCredential | null>(null);
  const [showEmployerCreate, setShowEmployerCreate] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<CredentialEmployer | null>(null);

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
      // Owner picker can fall back to vault list owners.
    }
  }, [accessToken]);

  const refreshOwnerDirectory = useCallback(async () => {
    if (!accessToken) {
      setOwnerDirectory([]);
      return;
    }
    try {
      const body = await listSecureCredentials(accessToken, {
        page: 1,
        page_size: 200,
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
      // Sidebar can still use owner options.
    }
  }, [accessToken]);

  const loadList = useCallback(async () => {
    if (!accessToken) {
      setListItems([]);
      setListTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await listSecureCredentials(accessToken, {
        page: 1,
        page_size: 200,
        q: search || undefined,
        credential_type: typeFilter === "all" ? undefined : typeFilter,
        owner_user_id: ownerFilter === "all" ? undefined : ownerFilter,
        vault_scope:
          ownerFilter !== "all" && treeSelection.kind === "personal"
            ? "personal"
            : ownerFilter !== "all" &&
                (treeSelection.kind === "jobs" || treeSelection.kind === "employer")
              ? "job"
              : undefined,
        employer_id:
          treeSelection.kind === "employer" ? treeSelection.employerId : undefined,
      });
      setListItems(body.items);
      setListTotal(body.total);
    } catch (e) {
      setListItems([]);
      setListTotal(0);
      const message = e instanceof Error ? e.message : "Failed to load credentials.";
      if (/403|forbidden|administrator/i.test(message)) {
        setError("Only administrators can manage credentials.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, search, typeFilter, ownerFilter, treeSelection]);

  const loadTreeAndEmployers = useCallback(async () => {
    if (!accessToken || ownerFilter === "all") {
      setTree(null);
      setEmployers([]);
      return;
    }
    setTreeLoading(true);
    try {
      const [treeBody, empBody] = await Promise.all([
        getCredentialTree(accessToken, ownerFilter),
        listCredentialEmployers(accessToken, ownerFilter),
      ]);
      setTree(treeBody);
      setEmployers(empBody.items);
    } catch (e) {
      setTree(null);
      setEmployers([]);
      setError(e instanceof Error ? e.message : "Failed to load vault tree.");
    } finally {
      setTreeLoading(false);
    }
  }, [accessToken, ownerFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadOwners();
  }, [loadOwners]);

  useEffect(() => {
    void refreshOwnerDirectory();
  }, [refreshOwnerDirectory]);

  useEffect(() => {
    void loadTreeAndEmployers();
  }, [loadTreeAndEmployers]);

  const skipSearchReset = useRef(true);
  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchDraft.trim()), 280);
    return () => window.clearTimeout(handle);
  }, [searchDraft]);

  useEffect(() => {
    if (skipSearchReset.current) {
      skipSearchReset.current = false;
      return;
    }
  }, [search]);

  const mergedOwnerOptions = useMemo(() => {
    const byId = new Map<number, CredentialOwnerOption>();
    for (const option of ownerOptions) byId.set(option.id, option);
    for (const row of listItems) {
      if (row.owner_user_id <= 0 || byId.has(row.owner_user_id)) continue;
      byId.set(row.owner_user_id, {
        id: row.owner_user_id,
        label: row.owner_name?.trim()
          ? `${row.owner_name.trim()} · #${row.owner_user_id}`
          : `User #${row.owner_user_id}`,
      });
    }
    for (const owner of ownerDirectory) {
      if (byId.has(owner.id)) continue;
      byId.set(owner.id, {
        id: owner.id,
        label: `${owner.name} · #${owner.id}`,
      });
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
  }, [ownerOptions, listItems, ownerDirectory]);

  const sidebarOwners = useMemo(() => {
    const fromUsers: VaultOwnerSummary[] = ownerOptions.map((o) => {
      const name = o.label.split(" · ")[0] || o.label;
      const detail = o.label.includes(" · ")
        ? o.label.split(" · ").slice(1).join(" · ")
        : undefined;
      const dir = ownerDirectory.find((d) => d.id === o.id);
      return {
        id: o.id,
        name,
        detail,
        count: dir?.count ?? 0,
      };
    });
    const known = new Set(fromUsers.map((u) => u.id));
    for (const dir of ownerDirectory) {
      if (!known.has(dir.id)) fromUsers.push(dir);
    }
    return fromUsers.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [ownerOptions, ownerDirectory]);

  const filteredPeople = useMemo(() => {
    const q = peopleQuery.trim().toLowerCase();
    if (!q) return sidebarOwners;
    return sidebarOwners.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.detail?.toLowerCase().includes(q) ?? false) ||
        String(o.id).includes(q),
    );
  }, [sidebarOwners, peopleQuery]);

  const totalPeopleCount = useMemo(
    () => sidebarOwners.reduce((sum, o) => sum + o.count, 0),
    [sidebarOwners],
  );

  const selectedOwner = useMemo(
    () =>
      ownerFilter === "all" ? null : (sidebarOwners.find((o) => o.id === ownerFilter) ?? null),
    [sidebarOwners, ownerFilter],
  );

  const detailItems = useMemo(() => {
    if (ownerFilter === "all" || search) return listItems;
    if (!tree) return listItems;
    if (treeSelection.kind === "personal") return tree.personal.items;
    if (treeSelection.kind === "jobs") {
      return tree.jobs.employers.flatMap((e) => e.items);
    }
    if (treeSelection.kind === "employer") {
      const emp = tree.jobs.employers.find((e) => e.id === treeSelection.employerId);
      return emp?.items ?? [];
    }
    return [...tree.personal.items, ...tree.jobs.employers.flatMap((e) => e.items)];
  }, [ownerFilter, search, listItems, tree, treeSelection]);

  const filteredDetailItems = useMemo(() => {
    if (typeFilter === "all") return detailItems;
    return detailItems.filter((r) => r.credential_type === typeFilter);
  }, [detailItems, typeFilter]);

  const breadcrumb = useMemo(() => {
    if (ownerFilter === "all") return ["Everyone"];
    const name = selectedOwner?.name || tree?.owner_name || `User #${ownerFilter}`;
    if (treeSelection.kind === "personal") return [name, "Personal"];
    if (treeSelection.kind === "jobs") return [name, "Jobs"];
    if (treeSelection.kind === "employer") {
      const emp = tree?.jobs.employers.find((e) => e.id === treeSelection.employerId);
      return [name, "Jobs", emp?.name || "Employer"];
    }
    return [name];
  }, [ownerFilter, selectedOwner, tree, treeSelection]);

  const detailHeading = useMemo(() => {
    if (search) return `Search results`;
    if (ownerFilter === "all") return "All credentials";
    if (treeSelection.kind === "personal") return "Personal";
    if (treeSelection.kind === "jobs") return "Jobs / Employers";
    if (treeSelection.kind === "employer") {
      const emp = tree?.jobs.employers.find((e) => e.id === treeSelection.employerId);
      return emp?.name || "Employer";
    }
    return selectedOwner?.name || "Vault";
  }, [search, ownerFilter, treeSelection, tree, selectedOwner]);

  const searchActive = search.length > 0;
  const filtersActive = typeFilter !== "all" || ownerFilter !== "all";
  const searchPending = searchDraft.trim() !== search;

  const openCreate = (opts?: {
    ownerUserId?: number | null;
    vaultScope?: "personal" | "job";
    employerId?: number | null;
  }) => {
    const ownerId =
      opts?.ownerUserId && opts.ownerUserId > 0
        ? opts.ownerUserId
        : ownerFilter === "all"
          ? null
          : ownerFilter;
    setCreateForOwnerId(ownerId);
    setCreateDefaults({
      vaultScope:
        opts?.vaultScope ??
        (treeSelection.kind === "jobs" || treeSelection.kind === "employer"
          ? "job"
          : "personal"),
      employerId:
        opts?.employerId ??
        (treeSelection.kind === "employer" ? treeSelection.employerId : null),
    });
    if (accessToken && ownerId != null && ownerId > 0) {
      void listCredentialEmployers(accessToken, ownerId)
        .then((body) => setEmployers(body.items))
        .catch(() => undefined);
    }
    setShowCreate(true);
  };

  const refreshAll = async () => {
    await Promise.all([loadList(), loadTreeAndEmployers(), refreshOwnerDirectory()]);
  };

  const handleCreate = async (
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => {
    if (!accessToken) throw new Error("Not signed in.");
    await createSecureCredential(accessToken, payload as SecureCredentialCreateRequest);
    setToast({ kind: "success", message: "Credential saved" });
    await refreshAll();
  };

  const handleUpdate = async (
    id: number,
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => {
    if (!accessToken) throw new Error("Not signed in.");
    await updateSecureCredential(accessToken, id, payload as SecureCredentialUpdateRequest);
    setToast({ kind: "success", message: "Credential updated" });
    await refreshAll();
  };

  const handleDelete = async (credential: SecureCredential) => {
    if (!accessToken) throw new Error("Not signed in.");
    await deleteSecureCredential(accessToken, credential.id);
    setToast({ kind: "success", message: "Credential deleted" });
    await refreshAll();
  };

  const openEdit = async (row: SecureCredential) => {
    if (!accessToken) return;
    setEditLoading(true);
    try {
      const detail = row.secret
        ? row
        : await getSecureCredential(accessToken, row.id);
      if (detail.owner_user_id > 0) {
        const empBody = await listCredentialEmployers(
          accessToken,
          detail.owner_user_id,
        );
        setEmployers(empBody.items);
      }
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

  const handleCreateEmployer = async (
    payload: CredentialEmployerCreateRequest | CredentialEmployerUpdateRequest,
  ) => {
    if (!accessToken) throw new Error("Not signed in.");
    if (ownerFilter === "all") throw new Error("Select a person first.");
    const created = await createCredentialEmployer(accessToken, {
      ...(payload as CredentialEmployerCreateRequest),
      owner_user_id: ownerFilter,
    });
    setToast({ kind: "success", message: "Employer folder created" });
    await loadTreeAndEmployers();
    setTreeSelection({ kind: "employer", employerId: created.id });
  };

  const handleUpdateEmployer = async (
    payload: CredentialEmployerCreateRequest | CredentialEmployerUpdateRequest,
  ) => {
    if (!accessToken || !editingEmployer) throw new Error("Not signed in.");
    await updateCredentialEmployer(
      accessToken,
      editingEmployer.id,
      payload as CredentialEmployerUpdateRequest,
    );
    setToast({ kind: "success", message: "Employer updated" });
    await loadTreeAndEmployers();
  };

  const handleDeleteEmployer = async () => {
    if (!accessToken || treeSelection.kind !== "employer") return;
    try {
      await deleteCredentialEmployer(accessToken, treeSelection.employerId);
      setToast({ kind: "success", message: "Employer deleted" });
      setTreeSelection({ kind: "jobs" });
      await refreshAll();
    } catch (e) {
      setToast({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not delete employer.",
      });
    }
  };

  const handleInlineEmployer = async (name: string) => {
    if (!accessToken) throw new Error("Not signed in.");
    const ownerId = createForOwnerId ?? (ownerFilter === "all" ? undefined : ownerFilter);
    return createCredentialEmployer(accessToken, {
      name,
      owner_user_id: ownerId,
    });
  };

  if (!accessToken) {
    return <AuthRequiredNotice resourceLabel="Credentials" />;
  }

  const canAddEmployer =
    ownerFilter !== "all" &&
    (treeSelection.kind === "jobs" || treeSelection.kind === "employer" || treeSelection.kind === "root");

  const selectedEmployer =
    treeSelection.kind === "employer"
      ? (tree?.jobs.employers.find((e) => e.id === treeSelection.employerId) ?? null)
      : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-muted/30 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <ListSearchInput
              value={searchDraft}
              onChange={setSearchDraft}
              onSearch={() => setSearch(searchDraft.trim())}
              onClear={() => {
                setSearchDraft("");
                setSearch("");
              }}
              placeholder="Search service, type, person, employer, username, notes…"
              ariaLabel="Search credentials"
              pending={searchPending}
              loading={loading && (searchActive || searchPending)}
              appliedQuery={search}
              resultCount={searchActive ? listTotal : null}
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
                    onClick={() => setTypeFilter(opt.value)}
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
                  onClick={() => {
                    setTypeFilter("all");
                    setOwnerFilter("all");
                    setTreeSelection({ kind: "root" });
                  }}
                  className="px-2 text-xs font-semibold text-primary hover:underline"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <RefreshButton
              loading={loading || treeLoading}
              onClick={() => void refreshAll()}
              ariaLabel="Refresh credentials"
            />
            <button
              type="button"
              onClick={() => openCreate()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="size-4" aria-hidden />
              Add Credential
            </button>
          </div>
        </div>
      </div>

      <ListNotifications toast={toast} error={error} onDismissToast={() => setToast(null)} />

      <div className="grid min-h-[36rem] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:grid-cols-[15rem_14rem_minmax(0,1fr)]">
        {/* People */}
        <aside className="flex max-h-[36vh] flex-col border-b border-border/70 bg-gradient-to-b from-muted/40 to-muted/10 lg:max-h-none lg:border-b-0 lg:border-r">
          <div className="border-b border-border/70 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              People
            </p>
            <label className="relative mt-2 block">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={peopleQuery}
                onChange={(e) => setPeopleQuery(e.target.value)}
                placeholder="Filter people…"
                className="w-full rounded-lg border border-border/80 bg-card py-1.5 pl-7 pr-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Filter people"
              />
            </label>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => {
                setOwnerFilter("all");
                setTreeSelection({ kind: "root" });
              }}
              className={cn(
                "mb-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-all",
                ownerFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-card/80",
              )}
            >
              <Users className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-semibold">Everyone</span>
              <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                {totalPeopleCount || listTotal}
              </span>
            </button>
            <ul className="space-y-0.5">
              {filteredPeople.map((owner) => {
                const active = ownerFilter === owner.id;
                return (
                  <li key={owner.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerFilter(owner.id);
                        setTreeSelection({ kind: "root" });
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-all",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-card/80",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          active ? "bg-white/20" : "bg-primary/10 text-primary",
                        )}
                      >
                        {owner.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{owner.name}</span>
                        {owner.detail ? (
                          <span
                            className={cn(
                              "block truncate text-[10px]",
                              active ? "text-primary-foreground/75" : "text-muted-foreground",
                            )}
                          >
                            {owner.detail}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                          active ? "bg-white/15" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {owner.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Tree */}
        <aside className="flex max-h-[36vh] flex-col border-b border-border/70 lg:max-h-none lg:border-b-0 lg:border-r">
          <VaultTree
            tree={ownerFilter === "all" ? null : tree}
            selection={treeSelection}
            ownerName={selectedOwner?.name ?? null}
            loading={treeLoading}
            onSelect={setTreeSelection}
          />
        </aside>

        {/* Detail */}
        <section className="flex min-h-[22rem] min-w-0 flex-col">
          <SecureCredentialsTable
            items={filteredDetailItems}
            loading={loading}
            hasLoaded={!loading || filteredDetailItems.length > 0 || listItems.length > 0}
            showOwner={ownerFilter === "all" || Boolean(search)}
            showPath={Boolean(search) || ownerFilter === "all"}
            heading={detailHeading}
            subheading={`${filteredDetailItems.length} credential${filteredDetailItems.length === 1 ? "" : "s"}`}
            breadcrumb={breadcrumb}
            emptyTitle={
              searchActive || filtersActive
                ? "Nothing matches"
                : treeSelection.kind === "jobs"
                  ? "No job credentials yet"
                  : treeSelection.kind === "employer"
                    ? "No credentials under this employer"
                    : "Vault is empty"
            }
            emptyDescription={
              treeSelection.kind === "jobs" || treeSelection.kind === "employer"
                ? "Add an employer folder, then add portal logins under it."
                : "Save a PC login, Gmail, Outlook, or 2FA key under Personal — or switch to Jobs for employer folders."
            }
            primaryActionLabel="Add credential"
            secondaryActionLabel={
              canAddEmployer
                ? treeSelection.kind === "employer"
                  ? "Edit employer"
                  : "Add employer"
                : undefined
            }
            onPrimaryAction={() => openCreate()}
            onSecondaryAction={
              canAddEmployer
                ? () => {
                    if (treeSelection.kind === "employer" && selectedEmployer) {
                      setEditingEmployer({
                        id: selectedEmployer.id,
                        owner_user_id:
                          tree?.owner_user_id ?? (ownerFilter as number),
                        owner_name: tree?.owner_name ?? null,
                        name: selectedEmployer.name,
                        website_url: selectedEmployer.website_url,
                        notes: selectedEmployer.notes,
                        sort_order: selectedEmployer.sort_order,
                        credential_count: selectedEmployer.count,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      });
                    } else {
                      setShowEmployerCreate(true);
                    }
                  }
                : undefined
            }
            onEdit={(row) => void openEdit(row)}
            onDelete={setDeleting}
          />
          {treeSelection.kind === "employer" && selectedEmployer ? (
            <div className="border-t border-border/60 px-4 py-2 text-right">
              <button
                type="button"
                onClick={() => void handleDeleteEmployer()}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Delete employer folder
              </button>
            </div>
          ) : null}
        </section>
      </div>

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

      {showCreate ? (
        <SecureCredentialsFormDialog
          mode="create"
          ownerOptions={mergedOwnerOptions}
          employerOptions={employers}
          preferredOwnerUserId={createForOwnerId}
          defaults={createDefaults}
          onClose={() => {
            setShowCreate(false);
            setCreateForOwnerId(null);
          }}
          onSubmit={handleCreate}
          onCreateEmployerInline={handleInlineEmployer}
        />
      ) : null}

      {editing ? (
        <SecureCredentialsFormDialog
          mode="edit"
          initial={editing}
          ownerOptions={mergedOwnerOptions}
          employerOptions={employers}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => handleUpdate(editing.id, payload)}
          onCreateEmployerInline={handleInlineEmployer}
        />
      ) : null}

      {showEmployerCreate ? (
        <EmployerFormDialog
          mode="create"
          onClose={() => setShowEmployerCreate(false)}
          onSubmit={handleCreateEmployer}
        />
      ) : null}

      {editingEmployer ? (
        <EmployerFormDialog
          mode="edit"
          initial={editingEmployer}
          onClose={() => setEditingEmployer(null)}
          onSubmit={handleUpdateEmployer}
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
