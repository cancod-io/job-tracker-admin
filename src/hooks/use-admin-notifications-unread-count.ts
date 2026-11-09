/**
 * Unread-count hook stub for the admin notification bell.
 *
 * Wire into the shell header once the bell UI lands:
 *   const { unreadCount, refresh } = useAdminNotificationsUnreadCount();
 * Invalidate/refresh on realtime `notification.created`.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminNotificationsUnreadCount } from "@/lib/admin-notifications-api";
import { useAuth } from "@/providers/auth-provider";

export function useAdminNotificationsUnreadCount(pollMs = 60_000) {
  const { accessToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminNotificationsUnreadCount(accessToken);
      setUnreadCount(result.unread_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load unread count");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void refresh();
    if (!accessToken || pollMs <= 0) return;
    const id = window.setInterval(() => {
      void refresh();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [accessToken, pollMs, refresh]);

  return { unreadCount, loading, error, refresh };
}
