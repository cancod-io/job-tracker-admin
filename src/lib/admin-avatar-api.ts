/**
 * Admin-scoped avatar fetch. Avatars are Bearer-protected, so a plain `<img src>`
 * can't load them — the bytes are fetched here and turned into an object URL.
 *
 *   GET /api/admin/users/{user_id}/avatar          → image bytes (primary)
 *   GET /api/admin/users/{user_id}/avatar/download → image bytes (legacy fallback)
 */
import { fetchAuthedResponse } from "@/lib/fetch-authed";

const AVATAR_TIMEOUT_MS = 30_000;

const AVATAR_PATHS = (userId: number) => [
  `/api/admin/users/${userId}/avatar`,
  `/api/admin/users/${userId}/avatar/download`,
];

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
  let lastError: Error | null = null;

  for (const path of AVATAR_PATHS(userId)) {
    try {
      const res = await fetchAuthedResponse(token, path, {
        timeoutMs: AVATAR_TIMEOUT_MS,
        cache: "no-store",
      });
      return res.blob();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("Avatar download failed");
    }
  }

  throw lastError ?? new Error("Avatar not found");
}
