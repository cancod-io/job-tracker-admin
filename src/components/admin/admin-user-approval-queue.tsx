"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { UserAvatar } from "@/components/admin/user-avatar";
import { adminUsersQueryKeys } from "@/lib/admin-users-query-keys";
import {
  useAdminUsersListQuery,
  useAdminUsersTabCountsQuery,
} from "@/hooks/use-admin-users-queries";
import { formatDateTime } from "@/lib/format-date";
import { approvalBadgeClass, approvalLabel } from "@/lib/user-approval";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import type { UserApprovalStatus } from "@/types/auth";

type FilterValue = "all" | UserApprovalStatus;

export function AdminUserApprovalQueue() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, user } = useAuth();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);

  const listQuery = useAdminUsersListQuery({
    page,
    page_size: 50,
    approval_status: filter === "all" ? null : filter,
  });
  const tabCountsQuery = useAdminUsersTabCountsQuery();

  const items = listQuery.data?.items ?? [];

  const total = listQuery.data?.total ?? 0;
  const tabCounts = tabCountsQuery.data ?? null;
  const loading = listQuery.isLoading;
  const refreshing = listQuery.isFetching || tabCountsQuery.isFetching;
  const error =
    (listQuery.error instanceof Error ? listQuery.error.message : null) ??
    (tabCountsQuery.error instanceof Error ? tabCountsQuery.error.message : null);

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

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all });
  };

  if (!accessToken) {
    return null;
  }

  return (
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
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} aria-hidden />
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
          <table className="w-full min-w-[920px] text-left text-sm">
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
                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40",
                        isSelf && "bg-primary/[0.07] dark:bg-primary/15",
                      )}
                      onClick={() => router.push(`/users/${u.id}`)}
                      tabIndex={0}
                      role="link"
                      aria-label={`View details for ${u.full_name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/users/${u.id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={u.full_name || u.email}
                            profilePictureUrl={u.profile_picture_url}
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
        {" · "}
        <Link href="/users" className="text-primary hover:underline">
          Select a row to open the full user profile
        </Link>
      </p>
    </div>
  );
}
