"use client";

import { useQuery } from "@tanstack/react-query";
import { listAdminUsers, type ListAdminUsersParams } from "@/lib/admin-user-api";
import { adminUsersQueryKeys } from "@/lib/admin-users-query-keys";
import { useAuth } from "@/providers/auth-provider";

type AdminUsersQueryOptions = {
  enabled?: boolean;
};

function useAdminUsersAccess(enabled = true) {
  const { accessToken } = useAuth();
  return {
    accessToken,
    enabled: Boolean(accessToken) && enabled,
  };
}

export function useAdminUsersListQuery(
  params: ListAdminUsersParams,
  options: AdminUsersQueryOptions = {},
) {
  const { accessToken, enabled } = useAdminUsersAccess(options.enabled);
  return useQuery({
    queryKey: adminUsersQueryKeys.list(params),
    queryFn: () => listAdminUsers(accessToken!, params),
    enabled,
  });
}

export function useAdminUsersTabCountsQuery(options: AdminUsersQueryOptions = {}) {
  const { accessToken, enabled } = useAdminUsersAccess(options.enabled);
  return useQuery({
    queryKey: adminUsersQueryKeys.tabCounts(),
    queryFn: async () => {
      const [all, pending, approved, rejected] = await Promise.all([
        listAdminUsers(accessToken!, { page: 1, page_size: 1 }),
        listAdminUsers(accessToken!, { page: 1, page_size: 1, approval_status: "pending" }),
        listAdminUsers(accessToken!, { page: 1, page_size: 1, approval_status: "approved" }),
        listAdminUsers(accessToken!, { page: 1, page_size: 1, approval_status: "rejected" }),
      ]);
      return {
        all: all.total,
        pending: pending.total,
        approved: approved.total,
        rejected: rejected.total,
      };
    },
    enabled,
  });
}
