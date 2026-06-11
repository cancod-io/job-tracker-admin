import type { UserRole } from "@/types/auth";

export type PermissionCatalogItem = {
  key: string;
  category: string;
  label: string;
  description: string;
};

export type RolePermissionsEntry = {
  role: UserRole | string;
  editable: boolean;
  permissions: string[];
};

export type AdminPermissionsResponse = {
  catalog: PermissionCatalogItem[];
  roles: RolePermissionsEntry[];
};

/** The signed-in user's own effective permissions, from GET /api/admin/permissions/me. */
export type MyPermissionsResponse = {
  /** When true, the user has full access regardless of the granted list. */
  isAdmin: boolean;
  permissions: string[];
};

export type UpdateRolePermissionsBody = {
  permissions: string[];
};
