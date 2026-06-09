"use client";

import { useEffect, useState } from "react";
import {
  fetchApplicantAvatarBlob,
  shouldFetchUserAvatar,
  type AvatarFetchOptions,
} from "@/lib/admin-avatar-api";
import { useAuth } from "@/providers/auth-provider";

/**
 * Module-level cache of the fetched avatar blob per user, so the same applicant's
 * avatar (shown in the preview stack, the table row, and the detail modal) is
 * downloaded once. Each consumer derives its own object URL from the shared blob
 * and revokes it on unmount.
 */
const avatarBlobCache = new Map<number, Promise<Blob>>();

function getAvatarBlob(token: string, userId: number): Promise<Blob> {
  let promise = avatarBlobCache.get(userId);
  if (!promise) {
    promise = fetchApplicantAvatarBlob(token, userId).catch((err) => {
      // Don't cache failures — allow a later retry (e.g. after re-auth).
      avatarBlobCache.delete(userId);
      throw err;
    });
    avatarBlobCache.set(userId, promise);
  }
  return promise;
}

export function clearAvatarBlobCache(userId?: number): void {
  if (userId == null) {
    avatarBlobCache.clear();
    return;
  }
  avatarBlobCache.delete(userId);
}

/**
 * Resolves an applicant's avatar to a displayable object URL, or `null` when the
 * applicant has no avatar / it can't be loaded (caller falls back to initials).
 */
export function useApplicantAvatar(
  userId: number,
  profilePictureUrl: string | null,
  options?: AvatarFetchOptions,
): { displayUrl: string | null; loading: boolean } {
  const { accessToken } = useAuth();
  const enabled =
    Boolean(accessToken) &&
    userId > 0 &&
    shouldFetchUserAvatar(profilePictureUrl, options);

  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setDisplayUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);

    void getAvatarBlob(accessToken, userId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setDisplayUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setDisplayUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    enabled,
    accessToken,
    userId,
    profilePictureUrl,
    options?.attemptFetch,
    options?.hasAvatar,
  ]);

  return { displayUrl, loading };
}
