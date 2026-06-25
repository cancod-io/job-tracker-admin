"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { analyticsQueryKeys } from "@/lib/analytics-query-keys";
import { REALTIME_ANALYTICS_INVALIDATE_EVENT } from "@/lib/realtime-sync-events";

/**
 * Listens for WebSocket `analytics.invalidate` (via window CustomEvent) and
 * invalidates all admin analytics React Query caches.
 */
export function AnalyticsRealtimeSync() {
  const queryClient = useQueryClient();
  const pendingInvalidateRef = useRef(false);

  useEffect(() => {
    const invalidateAnalytics = () => {
      void queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.all });
    };

    const onInvalidate = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        pendingInvalidateRef.current = true;
        return;
      }
      invalidateAnalytics();
    };

    const onVisibilityChange = () => {
      if (
        pendingInvalidateRef.current &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        pendingInvalidateRef.current = false;
        invalidateAnalytics();
      }
    };

    window.addEventListener(REALTIME_ANALYTICS_INVALIDATE_EVENT, onInvalidate);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener(REALTIME_ANALYTICS_INVALIDATE_EVENT, onInvalidate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [queryClient]);

  return null;
}
