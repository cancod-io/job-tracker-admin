import type { AdminUserDetail } from "@/types/admin-user-api";
import type { UserApprovalStatus, UserRole } from "@/types/auth";

export function canManageUserApproval(role: UserRole | string | undefined): boolean {
  return role === "admin" || role === "moderator";
}

export function canDeleteUser(role: UserRole | string | undefined): boolean {
  return role === "admin";
}

export function canChangeUserRole(role: UserRole | string | undefined): boolean {
  return role === "admin";
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  moderator: "Moderator",
  user: "User",
};

export function roleLabel(role: UserRole | string): string {
  return ROLE_LABELS[role as UserRole] ?? role;
}

export function formatApprovedBy(detail: Pick<
  AdminUserDetail,
  "approved_by_name" | "approved_by_role" | "approved_by_id"
>): string {
  if (detail.approved_by_name) {
    const roleSuffix = detail.approved_by_role
      ? ` (${detail.approved_by_role})`
      : "";
    return `${detail.approved_by_name}${roleSuffix}`;
  }
  if (detail.approved_by_id != null) {
    return `User #${detail.approved_by_id}`;
  }
  return "—";
}

export function approvalLabel(status: UserApprovalStatus): string {
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

export function approvalBadgeClass(status: UserApprovalStatus): string {
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
