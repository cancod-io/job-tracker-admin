/**
 * Browser-side client for the admin Users API.
 *
 * Endpoints (OpenAPI `admin-users` tag):
 *   GET   /api/admin/users                              — list (page, page_size, approval_status, is_active)
 *   GET   /api/admin/users/{user_id}                    — full profile for detail panel
 *   GET    /api/admin/users/{user_id}/avatar            — avatar bytes
 *   GET    /api/admin/users/{user_id}/cvs/{cv_id}/download — CV bytes
 *   PATCH  /api/admin/users/{user_id}/status            — ban / activate
 *   DELETE /api/admin/users/{user_id}                    — remove user (admin only, 204)
 *
 * Approval + password reset remain on versioned routes:
 *   PATCH /api/v1/admin/users/{user_id}/approval        — admin + moderator
 *   POST  /api/v1/admin/users/{user_id}/reset-password
 */
import { API_PATHS } from "@/lib/api-paths";
import { fetchAuthedJson, fetchAuthedResponse } from "@/lib/fetch-authed";
import { resolveSocialFields } from "@/lib/admin-user-social";
import type {
  AdminUserCv,
  AdminUserDetail,
  AdminUserJobApplication,
  AdminUserListResponse,
  AdminUserRow,
  AdminUserSocialLink,
} from "@/types/admin-user-api";
import type { UserApprovalStatus, UserRole } from "@/types/auth";

const BASE = API_PATHS.adminUsers.base;

export type ListAdminUsersParams = {
  page?: number;
  page_size?: number;
  approval_status?: UserApprovalStatus | null;
  is_active?: boolean | null;
};

function positiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function nonNegativeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function normalizeSocialLink(raw: unknown): AdminUserSocialLink | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const platform = str(r.platform ?? r.name ?? r.type);
  const url = str(r.url ?? r.link);
  if (!platform || !url) return null;
  return { platform, url };
}

function normalizeJobApplication(raw: unknown): AdminUserJobApplication | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const application_id = nonNegativeInt(r.application_id ?? r.id, 0);
  const job_id = nonNegativeInt(r.job_id, 0);
  if (application_id <= 0) return null;
  return {
    application_id,
    job_id,
    job_title: str(r.job_title, "—"),
    company: str(r.company, "—"),
    status: str(r.status, "unknown"),
    applied_at: strOrNull(r.applied_at ?? r.created_at),
  };
}

function normalizeCv(raw: unknown): AdminUserCv | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = nonNegativeInt(r.id ?? r.cv_id, 0);
  if (id <= 0) return null;
  const fileSizeRaw = r.file_size ?? r.size_bytes;
  const file_size =
    typeof fileSizeRaw === "number" && Number.isFinite(fileSizeRaw) ? fileSizeRaw : null;
  return {
    id,
    filename: str(r.filename ?? r.name, `cv-${id}`),
    file_size,
    uploaded_at: strOrNull(r.uploaded_at ?? r.created_at),
  };
}

function resolveAvatarFields(r: Record<string, unknown>): {
  profile_picture_url: string | null;
  has_avatar: boolean;
} {
  const profile_picture_url = strOrNull(
    r.profile_picture_url ?? r.avatar_url ?? r.profile_image_url,
  );
  const has_avatar =
    bool(r.has_avatar ?? r.has_profile_picture ?? r.has_profile_image) ||
    Boolean(profile_picture_url);
  return { profile_picture_url, has_avatar };
}

function normalizeUserRow(raw: unknown): AdminUserRow | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = nonNegativeInt(r.id ?? r.user_id, 0);
  if (id <= 0) return null;
  const avatar = resolveAvatarFields(r);
  return {
    id,
    email: str(r.email),
    full_name: str(r.full_name ?? r.name, "—"),
    role: str(r.role, "user"),
    approval_status: (str(r.approval_status, "pending") as UserApprovalStatus),
    is_active: bool(r.is_active, true),
    created_at: str(r.created_at, new Date(0).toISOString()),
    last_login_at: strOrNull(r.last_login_at ?? r.last_login),
    profile_picture_url: avatar.profile_picture_url,
    has_avatar: avatar.has_avatar,
    application_count: nonNegativeInt(r.application_count, 0),
    applications_today: nonNegativeInt(r.applications_today, 0),
  };
}

function intOrNull(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function formatApprovedBy(r: Record<string, unknown>): {
  approved_by_id: number | null;
  approved_by_name: string | null;
  approved_by_role: string | null;
} {
  const approved_by_id = intOrNull(r.approved_by_id);
  const approved_by_name = strOrNull(r.approved_by_name ?? r.approved_by);
  const approved_by_role = strOrNull(r.approved_by_role);
  return { approved_by_id, approved_by_name, approved_by_role };
}

function normalizeUserDetail(raw: unknown): AdminUserDetail {
  const row = normalizeUserRow(raw);
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  const socialRaw = r.social_links ?? r.socials ?? [];
  const appsRaw = r.job_applications ?? r.applications ?? [];
  const cvsRaw = r.cvs ?? r.resumes ?? r.cv_files ?? [];

  const social_links = (Array.isArray(socialRaw) ? socialRaw : [])
    .map(normalizeSocialLink)
    .filter((v): v is AdminUserSocialLink => v != null);

  const job_applications = (Array.isArray(appsRaw) ? appsRaw : [])
    .map(normalizeJobApplication)
    .filter((v): v is AdminUserJobApplication => v != null);

  const cvs = (Array.isArray(cvsRaw) ? cvsRaw : [])
    .map(normalizeCv)
    .filter((v): v is AdminUserCv => v != null);

  const permissions = strArray(r.permissions);
  const approvedBy = formatApprovedBy(r);
  const website = strOrNull(r.website ?? r.website_url);
  const social = resolveSocialFields(r, social_links, website);

  return {
    ...(row ?? {
      id: 0,
      email: "",
      full_name: "—",
      role: "user",
      approval_status: "pending" as UserApprovalStatus,
      is_active: true,
      created_at: new Date(0).toISOString(),
      last_login_at: null,
      profile_picture_url: null,
      has_avatar: false,
    }),
    phone: strOrNull(r.phone ?? r.phone_number),
    country: strOrNull(r.country),
    city: strOrNull(r.city),
    zip_code: strOrNull(r.zip_code ?? r.postal_code ?? r.zip),
    company: strOrNull(r.company),
    job_title: strOrNull(r.job_title),
    website,
    bio: strOrNull(r.bio ?? r.about),
    last_login_at: strOrNull(r.last_login_at ?? r.last_login),
    approved_at: strOrNull(r.approved_at),
    approved_by_id: approvedBy.approved_by_id,
    approved_by_name: approvedBy.approved_by_name,
    approved_by_role: approvedBy.approved_by_role,
    permissions,
    two_factor_enabled: bool(r.two_factor_enabled ?? r.is_2fa_enabled ?? r.mfa_enabled),
    social,
    social_links,
    job_applications,
    cvs,
  };
}

function normalizeListResponse(
  raw: Record<string, unknown>,
  requestedPage: number,
  requestedPageSize: number,
): AdminUserListResponse {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const items = itemsRaw
    .map(normalizeUserRow)
    .filter((v): v is AdminUserRow => v != null);

  return {
    items,
    total: nonNegativeInt(raw.total, items.length),
    page: positiveInt(raw.page, requestedPage),
    page_size: positiveInt(raw.page_size, requestedPageSize),
  };
}

export async function listAdminUsers(
  token: string,
  params: ListAdminUsersParams = {},
): Promise<AdminUserListResponse> {
  const page = params.page ?? 1;
  const page_size = params.page_size ?? 50;
  const q = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
  });
  if (params.approval_status) q.set("approval_status", params.approval_status);
  if (params.is_active != null) q.set("is_active", String(params.is_active));

  const raw = await fetchAuthedJson<Record<string, unknown>>(token, `${BASE}?${q}`);
  return normalizeListResponse(raw, page, page_size);
}

export async function getAdminUser(token: string, userId: number): Promise<AdminUserDetail> {
  const raw = await fetchAuthedJson<unknown>(token, `${BASE}/${userId}`);
  return normalizeUserDetail(raw);
}

export async function patchUserApproval(
  token: string,
  userId: number,
  approval_status: Exclude<UserApprovalStatus, "pending">,
): Promise<void> {
  await fetchAuthedJson<unknown>(token, API_PATHS.adminUsers.approval(userId), {
    method: "PATCH",
    body: { approval_status },
  });
}

export async function patchUserActiveStatus(
  token: string,
  userId: number,
  is_active: boolean,
): Promise<void> {
  await fetchAuthedJson<unknown>(token, API_PATHS.adminUsers.status(userId), {
    method: "PATCH",
    body: { is_active },
  });
}

export async function resetUserPassword(token: string, userId: number): Promise<void> {
  await fetchAuthedJson<unknown>(token, API_PATHS.adminUsers.resetPassword(userId), {
    method: "POST",
  });
}

export async function patchUserRole(
  token: string,
  userId: number,
  role: UserRole,
): Promise<void> {
  await fetchAuthedJson<unknown>(token, API_PATHS.adminUsers.role(userId), {
    method: "PATCH",
    body: { role },
  });
}

export async function deleteAdminUser(token: string, userId: number): Promise<void> {
  await fetchAuthedJson<unknown>(token, `${BASE}/${userId}`, {
    method: "DELETE",
  });
}

export async function fetchUserCvBlob(
  token: string,
  userId: number,
  cvId: number,
): Promise<Blob> {
  const res = await fetchAuthedResponse(
    token,
    API_PATHS.adminUsers.cvDownload(userId, cvId),
    { timeoutMs: 60_000 },
  );
  return res.blob();
}

export async function downloadUserCv(
  token: string,
  userId: number,
  cvId: number,
  filename: string,
): Promise<void> {
  const blob = await fetchUserCvBlob(token, userId, cvId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
