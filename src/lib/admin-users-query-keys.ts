import type { ListAdminUsersParams } from "@/lib/admin-user-api";

export function adminUsersListParamsKey(params: ListAdminUsersParams = {}): ListAdminUsersParams {
  const key: ListAdminUsersParams = {};
  if (params.page != null) key.page = params.page;
  if (params.page_size != null) key.page_size = params.page_size;
  if (params.approval_status != null) key.approval_status = params.approval_status;
  if (params.is_active != null) key.is_active = params.is_active;
  return key;
}

export const adminUsersQueryKeys = {
  all: ["admin", "users"] as const,
  list: (params: ListAdminUsersParams) =>
    [...adminUsersQueryKeys.all, "list", adminUsersListParamsKey(params)] as const,
  tabCounts: () => [...adminUsersQueryKeys.all, "tab-counts"] as const,
};
