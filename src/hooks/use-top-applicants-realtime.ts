"use client";

import { useEffect, useState } from "react";
import { REALTIME_ANALYTICS_TOP_APPLICANTS_UPDATED_EVENT } from "@/lib/realtime-sync-events";
import type { TopApplicantsPayload } from "@/types/realtime";

export function useTopApplicantsRealtime() {
  const [payload, setPayload] = useState<TopApplicantsPayload | null>(null);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<TopApplicantsPayload>).detail;
      if (detail) setPayload(detail);
    };
    window.addEventListener(REALTIME_ANALYTICS_TOP_APPLICANTS_UPDATED_EVENT, onUpdate);
    return () =>
      window.removeEventListener(REALTIME_ANALYTICS_TOP_APPLICANTS_UPDATED_EVENT, onUpdate);
  }, []);

  return payload;
}
