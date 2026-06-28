"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { adminUsersQueryKeys } from "@/lib/admin-users-query-keys";
import {
  REALTIME_USER_UPDATED_EVENT,
  REALTIME_USERS_APPLICATION_STATS_UPDATED_EVENT,
} from "@/lib/realtime-sync-events";
import type { UsersApplicationStatsPayload } from "@/types/realtime";

/**
 * Listens for WebSocket user events (via window CustomEvent) and refreshes
 * admin users React Query caches — same pattern as AnalyticsRealtimeSync.
 */
export function UsersRealtimeSync() {
  const queryClient = useQueryClient();
  const pendingInvalidateRef = useRef(false);

  useEffect(() => {
    const invalidateUsers = () => {
      void queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all });
    };

    const onUserUpdated = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        pendingInvalidateRef.current = true;
        return;
      }
      invalidateUsers();
    };

    const onApplicationStats = (event: Event) => {
      const payload = (event as CustomEvent<UsersApplicationStatsPayload>).detail;
      if (!payload?.users?.length) return;

      const cachedLists = queryClient.getQueriesData<{ items?: { id: number }[]; total?: number }>({
        queryKey: adminUsersQueryKeys.all,
      });

      const hasUnknownUser = cachedLists.some(([, data]) => {
        const items = data?.items;
        if (!Array.isArray(items) || items.length === 0) return false;
        const knownIds = new Set(items.map((row) => row.id));
        return payload.users.some((stat) => !knownIds.has(stat.user_id));
      });

      if (!hasUnknownUser) return;

      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        pendingInvalidateRef.current = true;
        return;
      }
      invalidateUsers();
    };

    const onVisibilityChange = () => {
      if (
        pendingInvalidateRef.current &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        pendingInvalidateRef.current = false;
        invalidateUsers();
      }
    };

    window.addEventListener(REALTIME_USER_UPDATED_EVENT, onUserUpdated);
    window.addEventListener(REALTIME_USERS_APPLICATION_STATS_UPDATED_EVENT, onApplicationStats);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener(REALTIME_USER_UPDATED_EVENT, onUserUpdated);
      window.removeEventListener(REALTIME_USERS_APPLICATION_STATS_UPDATED_EVENT, onApplicationStats);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [queryClient]);

  return null;
}
