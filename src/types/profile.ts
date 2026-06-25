import type { UserApprovalStatus, UserRole } from "@/types/auth";

/** Full profile snapshot from `GET /api/v1/profile/me`. */
export type ProfileResponse = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  approval_status: UserApprovalStatus;
  country: string | null;
  city: string | null;
  zip_code: string | null;
  profile_picture_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Body for `PATCH /api/v1/profile/me`. Any field omitted is left unchanged. */
export type ProfileUpdateRequest = {
  full_name?: string | null;
  email?: string | null;
  country?: string | null;
  city?: string | null;
  zip_code?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
};

/** Body for `POST /api/v1/profile/me/password`. */
export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

/** Response from `POST /api/v1/profile/me/avatar`. */
export type AvatarUploadResponse = {
  profile_picture_url: string;
};
