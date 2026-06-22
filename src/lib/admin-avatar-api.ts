/**
 * Admin-scoped avatar fetch. Avatars are Bearer-protected, so a plain `<img src>`
 * can't load them — the bytes are fetched here and turned into an object URL.
 *
 * OpenAPI: GET /api/admin/users/{user_id}/avatar
 */
import { API_PATHS } from "@/lib/api-paths";
import { fetchAuthedResponse } from "@/lib/fetch-authed";

const AVATAR_TIMEOUT_MS = 8_000;

export type AvatarFetchOptions = {
  /** Backend boolean when URL is omitted but an avatar exists. */
  hasAvatar?: boolean;
  /** Always attempt download (e.g. user detail panel). */
  attemptFetch?: boolean;
};

/** True when an avatar download is worth attempting. */
export function shouldFetchUserAvatar(
  url: string | null | undefined,
  options?: AvatarFetchOptions,
): boolean {
  if (options?.attemptFetch) return true;
  if (options?.hasAvatar) return true;
  return Boolean(url?.trim());
}

/** @deprecated Use `shouldFetchUserAvatar`. */
export function hasApplicantAvatar(url: string | null | undefined): boolean {
  return shouldFetchUserAvatar(url);
}

export async function fetchApplicantAvatarBlob(token: string, userId: number): Promise<Blob> {
  const res = await fetchAuthedResponse(token, API_PATHS.adminUsers.avatar(userId), {
    timeoutMs: AVATAR_TIMEOUT_MS,
    cache: "no-store",
  });
  return res.blob();
}
