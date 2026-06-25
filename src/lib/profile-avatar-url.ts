/** Same-origin path for authenticated avatar download (via Next.js proxy). */
export const PROFILE_AVATAR_DOWNLOAD_PATH = "/api/v1/profile/me/avatar/download";

/** True when the profile has an uploaded avatar (any non-empty URL from the API). */
export function hasProfileAvatar(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}

/**
 * Normalize API `profile_picture_url` to the client download path.
 * The backend often returns an absolute URL; browsers cannot attach Bearer auth on `<img src>`.
 */
export function normalizeProfilePictureUrl(url: string | null | undefined): string | null {
  if (!hasProfileAvatar(url)) return null;
  const trimmed = url!.trim();
  if (trimmed.includes("/profile/me/avatar")) {
    return PROFILE_AVATAR_DOWNLOAD_PATH;
  }
  return trimmed;
}
