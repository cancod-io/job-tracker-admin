"use client";

import { AnalyticsDateRangePicker } from "@/components/admin/analytics/analytics-date-range-picker";
import { AnalyticsCompareSelect } from "@/components/admin/analytics/analytics-compare-select";
import { RefreshButton } from "@/components/admin/shared/refresh-button";

type AnalyticsPageHeaderProps = {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  showCompare?: boolean;
  showDateRange?: boolean;
  actions?: React.ReactNode;
};

export function AnalyticsPageHeader({
  title,
  subtitle,
  onRefresh,
  refreshing = false,
  showCompare = true,
  showDateRange = true,
  actions,
}: AnalyticsPageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onRefresh ? (
            <RefreshButton
              onClick={onRefresh}
              loading={refreshing}
              ariaLabel={`Refresh ${title}`}
            />
          ) : null}
        </div>
      </div>
      {showDateRange || showCompare ? (
        <div className="flex flex-wrap items-center gap-2">
          {showDateRange ? <AnalyticsDateRangePicker /> : null}
          {showCompare ? <AnalyticsCompareSelect compact /> : null}
        </div>
      ) : null}
    </div>
  );
}
