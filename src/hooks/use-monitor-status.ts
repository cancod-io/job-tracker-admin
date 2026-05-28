"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMonitorStatus } from "@/lib/scraper-api";
import type { MonitorStatus } from "@/types/scraper-api";

export type MonitorFetchTrigger = "initial" | "auto" | "manual" | "probe";

export type UseMonitorStatusOptions = {
  /** Whether the scraper service should fetch live SerpAPI account data (slower). */
  live: boolean;
  /** Background polling interval in ms. Set 0 / null to disable polling entirely. */
  intervalMs?: number | null;
  /**
   * Whether polling is currently active. Independent of `intervalMs` so the
   * consumer can pause/resume without losing the interval value.
   */
  pollingEnabled?: boolean;
  /** Fires after every successful fetch (initial, auto-poll, manual, probe). */
  onSuccess?: (status: MonitorStatus, trigger: MonitorFetchTrigger) => void;
  /** Fires after every failed fetch. */
  onError?: (error: Error, trigger: MonitorFetchTrigger) => void;
};

export type UseMonitorStatusReturn = {
  status: MonitorStatus | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  /** Manual refresh — defaults to a `manual` trigger; pass `rapidapi_probe` to burn 1 credit. */
  refetch: (opts?: { rapidapiProbe?: boolean; trigger?: MonitorFetchTrigger }) => Promise<void>;
};

const DEFAULT_INTERVAL_MS = 30_000;

/**
 * Drives the monitor-status fetch + polling lifecycle shared between the
 * dashboard's compact card and the full logs page.
 *
 * Behavior:
 *  - Fetches once on mount (trigger `"initial"`).
 *  - Polls at `intervalMs` while `pollingEnabled !== false` (auto trigger).
 *  - `refetch()` is callable any time; the in-flight request count is tracked
 *    so the `loading` flag only flips false when nothing is pending.
 */
export function useMonitorStatus(options: UseMonitorStatusOptions): UseMonitorStatusReturn {
  const {
    live,
    intervalMs = DEFAULT_INTERVAL_MS,
    pollingEnabled = true,
    onSuccess,
    onError,
  } = options;

  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const inFlightRef = useRef(0);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const fetchOnce = useCallback(
    async (trigger: MonitorFetchTrigger, rapidapiProbe = false) => {
      inFlightRef.current += 1;
      setLoading(true);
      setError(null);
      try {
        const data = await getMonitorStatus({ live, rapidapi_probe: rapidapiProbe });
        setStatus(data);
        setLastFetched(new Date());
        onSuccessRef.current?.(data, trigger);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err.message || "Failed to reach scraper service");
        onErrorRef.current?.(err, trigger);
      } finally {
        inFlightRef.current = Math.max(0, inFlightRef.current - 1);
        if (inFlightRef.current === 0) setLoading(false);
      }
    },
    [live],
  );

  // Initial fetch (also re-runs if `live` flips).
  useEffect(() => {
    void fetchOnce("initial");
  }, [fetchOnce]);

  // Background polling.
  useEffect(() => {
    if (!pollingEnabled || !intervalMs) return;
    const id = setInterval(() => void fetchOnce("auto"), intervalMs);
    return () => clearInterval(id);
  }, [pollingEnabled, intervalMs, fetchOnce]);

  const refetch = useCallback(
    (opts: { rapidapiProbe?: boolean; trigger?: MonitorFetchTrigger } = {}) =>
      fetchOnce(opts.trigger ?? (opts.rapidapiProbe ? "probe" : "manual"), opts.rapidapiProbe),
    [fetchOnce],
  );

  return { status, loading, error, lastFetched, refetch };
}
