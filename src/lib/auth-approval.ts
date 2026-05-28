import { createLoginAuthError, LOGIN_ERROR_CODES } from "@/lib/auth-errors";
import type { AuthUser } from "@/types/auth";

export function assertUserApproved(user: AuthUser): void {
  if (user.approval_status === "pending") {
    throw createLoginAuthError({
      message: "Your account is waiting for administrator approval before you can sign in.",
      code: LOGIN_ERROR_CODES.PENDING_APPROVAL,
      fields: [],
    });
  }
  if (user.approval_status === "rejected") {
    throw createLoginAuthError({
      message: "Your registration was not approved. Contact support if you believe this is an error.",
      code: LOGIN_ERROR_CODES.ACCOUNT_REJECTED,
      fields: [],
    });
  }
}

