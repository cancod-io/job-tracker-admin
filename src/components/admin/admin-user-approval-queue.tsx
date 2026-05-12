"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { ADMIN_PENDING_APPROVAL_CHANGED_EVENT } from "@/lib/admin-sync-events";
import { apiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/http";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import type { UserApprovalStatus } from "@/types/auth";

type AdminUserRow = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  approval_status: UserApprovalStatus;
  is_active: boolean;
  created_at: string;
};

type ListResponse = {
  items: AdminUserRow[];
  total: number;
  page: number;
  page_size: number;
};

function approvalLabel(status: UserApprovalStatus): string {
  switch (status) {
    case "pending":
      return "Waiting for approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function badgeClass(status: UserApprovalStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30";
    case "approved":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/25";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

type FilterValue = "all" | UserApprovalStatus;

export function AdminUserApprovalQueue() {
  const { accessToken, user } = useAuth();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    setLoading(true);
    try {
      const q =
        filter === "all" ? "" : `?approval_status=${encodeURIComponent(filter)}`;
      const res = await fetchWithTimeout(apiUrl(`/api/v1/admin/users${q}`), {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "omit",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? `Request failed (${res.status})`);
      }
      setData((await res.json()) as ListResponse);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(ADMIN_PENDING_APPROVAL_CHANGED_EVENT));
      }
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchApproval = async (userId: number, approval_status: Exclude<UserApprovalStatus, "pending">) => {
    if (!accessToken) return;
    if (approval_status === "rejected" && user != null && userId === user.id) {
      setError("You cannot reject your own account.");
      return;
    }
    setActionUserId(userId);
    setError(null);
    try {
      const res = await fetchWithTimeout(apiUrl(`/api/v1/admin/users/${userId}/approval`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approval_status }),
        credentials: "omit",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? `Update failed (${res.status})`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setActionUserId(null);
    }
  };

  if (!accessToken) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
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

      {error ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
        {loading && !data ? (
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
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Approval</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No users match this filter.
                  </td>
                </tr>
              ) : (
                data?.items.map((u) => {
                  const isSelf = user != null && u.id === user.id;
                  return (
                  <tr
                    key={u.id}
                    className={cn(
                      "border-b border-border/60 last:border-0",
                      isSelf && "bg-primary/[0.07] dark:bg-primary/15",
                    )}
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{u.full_name}</span>
                        {isSelf ? (
                          <span className="inline-flex rounded-full border border-primary/35 bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Your account
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground tabular-nums">
                      {formatCreatedAt(u.created_at)}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{u.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          badgeClass(u.approval_status),
                        )}
                      >
                        {approvalLabel(u.approval_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.is_active ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {u.approval_status !== "approved" ? (
                          <button
                            type="button"
                            className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                            disabled={actionUserId === u.id}
                            onClick={() => void patchApproval(u.id, "approved")}
                          >
                            Approve
                          </button>
                        ) : null}
                        {u.approval_status !== "rejected" ? (
                          <button
                            type="button"
                            className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                            disabled={actionUserId === u.id || isSelf}
                            title={
                              isSelf ? "You cannot reject your own account" : undefined
                            }
                            aria-label={
                              isSelf ? "Reject unavailable for your own account" : "Reject"
                            }
                            onClick={() => void patchApproval(u.id, "rejected")}
                          >
                            Reject
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {data ? (
        <p className="text-xs text-muted-foreground">
          Showing {data.items.length} of {data.total} users (page {data.page}).
        </p>
      ) : null}
    </div>
  );
}
