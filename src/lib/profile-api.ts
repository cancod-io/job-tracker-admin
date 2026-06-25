import { fetchAuthedJson } from "@/lib/fetch-authed";
import { normalizeProfilePictureUrl } from "@/lib/profile-avatar-url";
import { validateAvatarFile } from "@/lib/profile-file-utils";
import type {
  AvatarUploadResponse,
  ChangePasswordRequest,
  ProfileResponse,
  ProfileUpdateRequest,
} from "@/types/profile";

const UPLOAD_TIMEOUT_MS = 60_000;
const PASSWORD_CHANGE_TIMEOUT_MS = 30_000;

function withNormalizedAvatar(data: ProfileResponse): ProfileResponse {
  return {
    ...data,
    profile_picture_url: normalizeProfilePictureUrl(data.profile_picture_url),
  };
}

export async function fetchProfile(token: string): Promise<ProfileResponse> {
  const data = await fetchAuthedJson<ProfileResponse>(token, "/api/v1/profile/me");
  return withNormalizedAvatar(data);
}

export async function updateProfile(
  token: string,
  payload: ProfileUpdateRequest,
): Promise<ProfileResponse> {
  const data = await fetchAuthedJson<ProfileResponse>(token, "/api/v1/profile/me", {
    method: "PATCH",
    body: payload,
  });
  return withNormalizedAvatar(data);
}

export async function changePassword(
  token: string,
  payload: ChangePasswordRequest,
): Promise<void> {
  await fetchAuthedJson<void>(token, "/api/v1/profile/me/password", {
    method: "POST",
    body: payload,
    timeoutMs: PASSWORD_CHANGE_TIMEOUT_MS,
  });
}

export async function uploadAvatar(token: string, file: File): Promise<AvatarUploadResponse> {
  const err = validateAvatarFile(file);
  if (err) throw new Error(err);

  const formData = new FormData();
  formData.append("file", file);

  const data = await fetchAuthedJson<AvatarUploadResponse>(token, "/api/v1/profile/me/avatar", {
    method: "POST",
    body: formData,
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
  return {
    profile_picture_url:
      normalizeProfilePictureUrl(data.profile_picture_url) ?? data.profile_picture_url,
  };
}

export async function deleteAvatar(token: string): Promise<void> {
  await fetchAuthedJson<void>(token, "/api/v1/profile/me/avatar", {
    method: "DELETE",
  });
}
