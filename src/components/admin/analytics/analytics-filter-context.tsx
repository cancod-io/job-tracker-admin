"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  dateKeyToAnalyticsToExclusiveUtc,
  dateKeyToPostedFromUtc,
  toDateKey,
} from "@/lib/date-utils";
import { analyticsQueryKeys } from "@/lib/analytics-query-keys";
import { previousPeriodApiParams } from "@/lib/analytics-utils";
import type { AnalyticsQueryParams } from "@/types/admin-analytics-api";

export type AnalyticsDateRange = {
  from: string;
  to: string;
};

export type AnalyticsCompareMode = "none" | "previous_period";

type AnalyticsFilterContextValue = {
  dateRange: AnalyticsDateRange;
  setDateRange: (range: AnalyticsDateRange) => void;
  source: string;
  setSource: (source: string) => void;
  compareMode: AnalyticsCompareMode;
  setCompareMode: (mode: AnalyticsCompareMode) => void;
  apiParams: AnalyticsQueryParams;
  compareApiParams: AnalyticsQueryParams | null;
  triggerRefresh: () => void;
};

const AnalyticsFilterContext = createContext<AnalyticsFilterContextValue | null>(null);

function defaultDateRange(): AnalyticsDateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return { from: toDateKey(from), to: toDateKey(to) };
}

export function AnalyticsFilterProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>(defaultDateRange);
  const [source, setSource] = useState("");
  const [compareMode, setCompareMode] = useState<AnalyticsCompareMode>("previous_period");

  const apiParams = useMemo<AnalyticsQueryParams>(() => {
    const params: AnalyticsQueryParams = {
      from: dateKeyToPostedFromUtc(dateRange.from),
      to: dateKeyToAnalyticsToExclusiveUtc(dateRange.to),
    };
    if (source.trim()) params.source = source.trim();
    return params;
  }, [dateRange.from, dateRange.to, source]);

  const compareApiParams = useMemo(() => {
    if (compareMode !== "previous_period") return null;
    return previousPeriodApiParams(apiParams);
  }, [apiParams, compareMode]);

  const triggerRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.all });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      dateRange,
      setDateRange,
      source,
      setSource,
      compareMode,
      setCompareMode,
      apiParams,
      compareApiParams,
      triggerRefresh,
    }),
    [dateRange, source, compareMode, apiParams, compareApiParams, triggerRefresh],
  );

  return (
    <AnalyticsFilterContext.Provider value={value}>{children}</AnalyticsFilterContext.Provider>
  );
}

export function useAnalyticsFilters(): AnalyticsFilterContextValue {
  const ctx = useContext(AnalyticsFilterContext);
  if (!ctx) {
    throw new Error("useAnalyticsFilters must be used within AnalyticsFilterProvider");
  }
  return ctx;
}

export function useAnalyticsApiParams(): AnalyticsQueryParams {
  return useAnalyticsFilters().apiParams;
}
