"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { AdminUserDetailPanel } from "@/components/admin/admin-user-detail-panel";
import { ApplicantAvatar } from "@/components/admin/applicant-avatar";
import { listAdminUsers } from "@/lib/admin-user-api";
import { ADMIN_PENDING_APPROVAL_CHANGED_EVENT, dispatchAdminPendingApprovalChanged } from "@/lib/admin-sync-events";
import { REALTIME_USER_UPDATED_EVENT } from "@/lib/realtime-sync-events";
import { formatDateTime } from "@/lib/format-date";
import { approvalBadgeClass, approvalLabel } from "@/lib/user-approval";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import type { AdminUserRow } from "@/types/admin-user-api";
import type { UserApprovalStatus } from "@/types/auth";

type FilterValue = "all" | UserApprovalStatus;

type TabCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
};

export function AdminUserApprovalQueue() {
  const { accessToken, user } = useAuth();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tabCounts, setTabCounts] = useState<TabCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const loadCounts = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [all, pending, approved, rejected] = await Promise.all([
        listAdminUsers(accessToken, { page: 1, page_size: 1 }),
        listAdminUsers(accessToken, { page: 1, page_size: 1, approval_status: "pending" }),
        listAdminUsers(accessToken, { page: 1, page_size: 1, approval_status: "approved" }),
        listAdminUsers(accessToken, { page: 1, page_size: 1, approval_status: "rejected" }),
      ]);
      setTabCounts({
        all: all.total,
        pending: pending.total,
        approved: approved.total,
        rejected: rejected.total,
      });
    } catch {
      /* counts are optional */
    }
  }, [accessToken]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    setLoading(true);
    try {
      const body = await listAdminUsers(accessToken, {
        page,
        page_size: 50,
        approval_status: filter === "all" ? null : filter,
      });
      setItems(body.items);
      setTotal(body.total);
      dispatchAdminPendingApprovalChanged();
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    const onUsersChanged = () => {
      void loadCounts();
      void load();
    };
    window.addEventListener(ADMIN_PENDING_APPROVAL_CHANGED_EVENT, onUsersChanged);
    window.addEventListener(REALTIME_USER_UPDATED_EVENT, onUsersChanged);
    return () => {
      window.removeEventListener(ADMIN_PENDING_APPROVAL_CHANGED_EVENT, onUsersChanged);
      window.removeEventListener(REALTIME_USER_UPDATED_EVENT, onUsersChanged);
    };
  }, [load, loadCounts]);

  const filteredItems = useMemo(() => {
    const q = searchDraft.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.id).includes(q),
    );
  }, [items, searchDraft]);

  const tabLabel = (value: FilterValue, label: string) => {
    const count = tabCounts?.[value];
    return count != null ? `${label} (${count})` : label;
  };

  if (!accessToken) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by approval">
            {(
              [
                ["all", "All users"],
                ["pending", "Waiting for approval"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === value
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
              >
                {tabLabel(value, label)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[12rem] flex-1 lg:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search user…"
                className="w-full rounded-lg border border-border/80 bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Search users"
              />
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

        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-6 animate-spin motion-reduce:animate-none" aria-hidden />
              Loading users…
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Last login</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      {searchDraft.trim() ? "No users match your search." : "No users match this filter."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((u) => {
                    const isSelf = user != null && u.id === user.id;
                    const isSelected = selectedUserId === u.id;
                    return (
                      <tr
                        key={u.id}
                        className={cn(
                          "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40",
                          isSelf && "bg-primary/[0.07] dark:bg-primary/15",
                          isSelected && "bg-primary/10",
                        )}
                        onClick={() => setSelectedUserId(u.id)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${u.full_name}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedUserId(u.id);
                          }
                        }}
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-3">
                            <ApplicantAvatar
                              userId={u.id}
                              name={u.full_name || u.email}
                              profilePictureUrl={u.profile_picture_url}
                              hasAvatar={u.has_avatar}
                              sizeClass="size-9"
                              textClass="text-xs"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-foreground">{u.full_name}</span>
                                {isSelf ? (
                                  <span className="inline-flex rounded-full border border-primary/35 bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                    Your account
                                  </span>
                                ) : null}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                          {formatDateTime(u.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                          {u.last_login_at ? formatDateTime(u.last_login_at) : "—"}
                        </td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{u.role}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              approvalBadgeClass(u.approval_status),
                            )}
                          >
                            {approvalLabel(u.approval_status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.is_active ? "Yes" : "No"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {filteredItems.length} of {total} users
          {searchDraft.trim() ? " (filtered)" : ""}
          {page > 1 ? ` · page ${page}` : ""}
        </p>
      </div>

      <AdminUserDetailPanel
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUpdated={() => void load()}
      />
    </>
  );
}
