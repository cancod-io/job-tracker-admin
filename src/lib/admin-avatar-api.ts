/**
 * Admin-scoped avatar fetch. Avatars are Bearer-protected, so a plain `<img src>`
 * can't load them — the bytes are fetched here and turned into an object URL.
 *
 *   GET /api/admin/users/{user_id}/avatar/download  → image bytes
 */
import { fetchAuthedResponse } from "@/lib/fetch-authed";

const AVATAR_TIMEOUT_MS = 30_000;

/** True when the applicant has an avatar worth fetching. */
export function hasApplicantAvatar(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}

export async function fetchApplicantAvatarBlob(token: string, userId: number): Promise<Blob> {
  const res = await fetchAuthedResponse(token, `/api/admin/users/${userId}/avatar/download`, {
    timeoutMs: AVATAR_TIMEOUT_MS,
    cache: "no-store",
  });
  return res.blob();
}
