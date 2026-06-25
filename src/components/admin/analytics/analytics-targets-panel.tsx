"use client";

import Link from "next/link";
import { AnalyticsPageHeader } from "@/components/admin/analytics/analytics-page-header";
import { AnalyticsPageState } from "@/components/admin/analytics/analytics-page-state";
import { AnalyticsSectionCard } from "@/components/admin/analytics/analytics-section-card";
import { useAnalyticsFilters } from "@/components/admin/analytics/analytics-filter-context";
import {
  useAnalyticsTargetsSummaryQuery,
  queryErrorMessage,
} from "@/hooks/use-analytics-queries";
import { formatAnalyticsNumber } from "@/lib/analytics-utils";

export function AnalyticsTargetsPanel() {
  const { triggerRefresh } = useAnalyticsFilters();
  const targetsQuery = useAnalyticsTargetsSummaryQuery();
  const data = targetsQuery.data ?? null;

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Scrape Targets"
        subtitle="Summary of companies, career URLs, and block lists used by scrapers."
        showCompare={false}
        onRefresh={triggerRefresh}
        refreshing={targetsQuery.isFetching}
      />
      <AnalyticsPageState
        loading={targetsQuery.isLoading}
        error={queryErrorMessage(targetsQuery.error)}
        empty={!data}
      >
        {data ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TargetCard
              title="Companies"
              total={data.companies.total}
              stale={data.companies.stale}
              href="/companies"
            />
            <TargetCard
              title="Career URLs"
              total={data.career_urls.total}
              stale={data.career_urls.stale}
              href="/career-urls"
            />
            <TargetCard
              title="Block Lists"
              total={data.scam_urls.total}
              href="/scam-urls"
            />
          </div>
        ) : null}
      </AnalyticsPageState>
    </div>
  );
}

function TargetCard({
  title,
  total,
  stale,
  href,
}: {
  title: string;
  total: number;
  stale?: number;
  href: string;
}) {
  return (
    <AnalyticsSectionCard title={title}>
      <p className="text-3xl font-semibold tabular-nums text-foreground">
        {formatAnalyticsNumber(total)}
      </p>
      {stale != null ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {formatAnalyticsNumber(stale)} stale targets
        </p>
      ) : null}
      <Link href={href} className="mt-4 inline-block text-sm font-medium text-primary underline">
        Manage {title.toLowerCase()}
      </Link>
    </AnalyticsSectionCard>
  );
}
