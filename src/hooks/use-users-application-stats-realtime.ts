"use client";

import { useEffect, useState } from "react";
import { REALTIME_USERS_APPLICATION_STATS_UPDATED_EVENT } from "@/lib/realtime-sync-events";
import type { UsersApplicationStatsPayload } from "@/types/realtime";

export function useUsersApplicationStatsRealtime() {
  const [payload, setPayload] = useState<UsersApplicationStatsPayload | null>(null);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<UsersApplicationStatsPayload>).detail;
      if (detail) setPayload(detail);
    };
    window.addEventListener(REALTIME_USERS_APPLICATION_STATS_UPDATED_EVENT, onUpdate);
    return () =>
      window.removeEventListener(REALTIME_USERS_APPLICATION_STATS_UPDATED_EVENT, onUpdate);
  }, []);

  return payload;
}
