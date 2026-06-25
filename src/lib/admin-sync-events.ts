/** Dispatched on `window` after admin approval actions change who is pending — sidebar listens to refresh the badge count. */
export const ADMIN_PENDING_APPROVAL_CHANGED_EVENT = "sjt-admin-pending-approval-changed";

export function dispatchAdminPendingApprovalChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_PENDING_APPROVAL_CHANGED_EVENT));
}
