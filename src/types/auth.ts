export type UserRole = "admin" | "moderator" | "user";

export type UserApprovalStatus = "pending" | "approved" | "rejected";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  approval_status: UserApprovalStatus;
  email_verified?: boolean;
};

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in?: number;
};

/** After registration: verify email before sign-in; pending users also need admin approval. */
export type RegisterResult =
  | { status: "authenticated" }
  | { status: "needs_verification"; email: string }
  | { status: "pending"; email: string };

export type VerifyEmailPayload = {
  email: string;
  code: string;
};

export type ResendVerificationPayload = {
  email: string;
};
