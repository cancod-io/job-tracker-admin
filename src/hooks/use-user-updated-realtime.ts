"use client";

import { useEffect, useState } from "react";
import { REALTIME_USER_UPDATED_EVENT } from "@/lib/realtime-sync-events";
import type { UserUpdatedPayload } from "@/types/realtime";

export function useUserUpdatedRealtime() {
  const [payload, setPayload] = useState<UserUpdatedPayload | null>(null);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<UserUpdatedPayload>).detail;
      if (detail) setPayload(detail);
    };
    window.addEventListener(REALTIME_USER_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(REALTIME_USER_UPDATED_EVENT, onUpdate);
  }, []);

  return payload;
}
