"use client";

import { DateRangeFilter } from "@/components/admin/jobs/date-range-filter";
import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";
import { toDateKey } from "@/lib/date-utils";

function defaultAnalyticsDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return { from: toDateKey(from), to: toDateKey(to) };
}

export function AnalyticsDateRangePicker() {
  const { dateRange, setDateRange } = useAnalyticsFilters();

  return (
    <DateRangeFilter
      from={dateRange.from}
      to={dateRange.to}
      ariaLabel="Filter analytics by date range"
      onChange={(from, to) => {
        if (!from && !to) {
          setDateRange(defaultAnalyticsDateRange());
          return;
        }
        setDateRange({ from, to });
      }}
    />
  );
}
