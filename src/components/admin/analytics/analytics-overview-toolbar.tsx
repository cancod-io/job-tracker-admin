"use client";

import { AnalyticsCompareSelect } from "@/components/admin/analytics/analytics-compare-select";
import { AnalyticsDateRangePicker } from "@/components/admin/analytics/analytics-date-range-picker";
import { RefreshButton } from "@/components/admin/shared/refresh-button";

type AnalyticsOverviewToolbarProps = {
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
};

export function AnalyticsOverviewToolbar({
  onRefresh,
  refreshing = false,
  actions,
}: AnalyticsOverviewToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
      <div className="flex flex-wrap items-center gap-2">
        <AnalyticsDateRangePicker />

        <AnalyticsCompareSelect compact />

        {actions}

        {onRefresh ? (
          <RefreshButton
            onClick={onRefresh}
            loading={refreshing}
            ariaLabel="Refresh analytics overview"
          />
        ) : null}
      </div>
    </div>
  );
}
