"use client";

import { useEffect, useState } from "react";
import { fetchAuthedResponse } from "@/lib/fetch-authed";
import { hasProfileAvatar, PROFILE_AVATAR_DOWNLOAD_PATH } from "@/lib/profile-avatar-url";

const AVATAR_FETCH_TIMEOUT_MS = 30_000;

/**
 * Loads the profile avatar via the authenticated same-origin proxy and returns
 * a blob URL for `<img>`.
 */
export function useAdminAvatarDisplayUrl(
  accessToken: string,
  profilePictureUrl: string | null,
  refreshKey = 0,
): { displayUrl: string | null; loading: boolean } {
  const enabled = Boolean(accessToken) && hasProfileAvatar(profilePictureUrl);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const res = await fetchAuthedResponse(accessToken, PROFILE_AVATAR_DOWNLOAD_PATH, {
          cache: "no-store",
          timeoutMs: AVATAR_FETCH_TIMEOUT_MS,
        });
        const blob = await res.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        setDisplayUrl(objectUrl);
      } catch {
        if (!cancelled) setDisplayUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      setDisplayUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [accessToken, enabled, profilePictureUrl, refreshKey]);

  return { displayUrl: enabled ? displayUrl : null, loading: enabled && loading };
}
