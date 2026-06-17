export type UserRole = "admin" | "moderator" | "user";

export type UserApprovalStatus = "pending" | "approved" | "rejected";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  approval_status: UserApprovalStatus;
};

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in?: number;
};

/** After registration: pending users are not signed in until an admin approves. */
export type RegisterResult = { status: "authenticated" } | { status: "pending"; email: string };
