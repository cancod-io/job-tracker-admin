import type { UserRole } from "@/types/auth";

export type PermissionKey =
  | "users.read"
  | "users.approve"
  | "users.ban"
  | "users.change_role"
  | "users.reset_password"
  | "users.delete"
  | "jobs.read"
  | "jobs.edit"
  | "jobs.delete"
  | "jobs.mark_scam"
  | "applications.read"
  | "applications.edit"
  | "applications.delete"
  | "companies.read"
  | "companies.manage"
  | "scraping.read"
  | "scraping.manage"
  | "career_urls.read"
  | "career_urls.manage"
  | "scam_urls.read"
  | "scam_urls.manage"
  | "stats.read"
  | "permissions.manage"
  | "api_config.read"
  | "api_config.manage";

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
  role: UserRole;
  /** When true, the user has full access regardless of the granted list. */
  isAdmin: boolean;
  /** Effective access — use for gating. */
  permissions: string[];
  role_template: string[];
  user_permissions: string[];
};

export type UserPermissionsResponse = {
  user_id: number;
  role: UserRole;
  editable: boolean;
  role_template: string[];
  user_permissions: string[];
  effective_permissions: string[];
};

export type UpdateRolePermissionsBody = {
  permissions: string[];
};

export type UpdateUserPermissionsBody = {
  permissions: string[];
};
