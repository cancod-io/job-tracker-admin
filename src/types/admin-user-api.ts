import type { UserApprovalStatus, UserRole } from "@/types/auth";

export type AdminUserRow = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole | string;
  approval_status: UserApprovalStatus;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  profile_picture_url: string | null;
  has_avatar: boolean;
};

export type AdminUserListResponse = {
  items: AdminUserRow[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminUserSocialLink = {
  platform: string;
  url: string;
};

/** Flat social URLs from the user profile (matches the member app form). */
export type AdminUserSocialFields = {
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
};

export type AdminUserCv = {
  id: number;
  filename: string;
  file_size: number | null;
  uploaded_at: string | null;
};

export type AdminUserDetail = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole | string;
  approval_status: UserApprovalStatus;
  is_active: boolean;
  created_at: string;
  profile_picture_url: string | null;
  has_avatar: boolean;
  phone: string | null;
  country: string | null;
  city: string | null;
  zip_code: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  bio: string | null;
  last_login_at: string | null;
  approved_at: string | null;
  approved_by_id: number | null;
  approved_by_name: string | null;
  approved_by_role: string | null;
  permissions: string[];
  two_factor_enabled: boolean;
  social: AdminUserSocialFields;
  social_links: AdminUserSocialLink[];
  cvs: AdminUserCv[];
};
