"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";
import {
  chartViewToApiParams,
  type AnalyticsChartView,
} from "@/lib/analytics-chart-view";
import { analyticsQueryKeys } from "@/lib/analytics-query-keys";
import { queryErrorMessage } from "@/hooks/use-analytics-queries";
import type { AnalyticsQueryParams } from "@/types/admin-analytics-api";
import { useAuth } from "@/providers/auth-provider";

type UseAnalyticsChartDataOptions = {
  queryKey: readonly string[];
  extraParams?: Partial<AnalyticsQueryParams>;
  defaultView?: AnalyticsChartView;
};

export function useAnalyticsChartData<T>(
  fetcher: (token: string, params: AnalyticsQueryParams) => Promise<T>,
  options: UseAnalyticsChartDataOptions,
) {
  const { accessToken } = useAuth();
  const { apiParams } = useAnalyticsFilters();
  const [view, setView] = useState<AnalyticsChartView>(options.defaultView ?? "day");

  const chartParams = useMemo(
    () => ({
      ...chartViewToApiParams(apiParams, view),
      ...options.extraParams,
    }),
    [apiParams, view, options.extraParams],
  );

  const query = useQuery({
    queryKey: [...analyticsQueryKeys.all, ...options.queryKey, chartParams],
    queryFn: () => fetcher(accessToken!, chartParams),
    enabled: Boolean(accessToken),
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: queryErrorMessage(query.error),
    view,
    setView,
    chartParams,
    reload: () => void query.refetch(),
  };
}
