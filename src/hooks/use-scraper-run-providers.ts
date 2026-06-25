"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { filterApiConfigSources } from "@/components/admin/api-config/api-config-filters";
import { getApiConfig } from "@/lib/api-config-api";
import {
  buildScraperRunControlRows,
  buildScraperRunLogFilterOptions,
  type ScraperRunControlRow,
  type ScraperRunFilterOption,
} from "@/lib/scraper-provider-utils";
import type { ApiConfigSource } from "@/types/api-config-api";

type UseScraperRunProvidersOptions = {
  /** When provided, skips fetching and builds rows from these sources. */
  sources?: ApiConfigSource[];
};

type UseScraperRunProvidersResult = {
  sources: ApiConfigSource[];
  controlRows: ScraperRunControlRow[];
  filterOptions: ScraperRunFilterOption[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useScraperRunProviders(
  accessToken: string | null,
  options: UseScraperRunProvidersOptions = {},
): UseScraperRunProvidersResult {
  const externalSources = options.sources;
  const [fetchedSources, setFetchedSources] = useState<ApiConfigSource[]>([]);
  const [loading, setLoading] = useState(!externalSources);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (externalSources || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const config = await getApiConfig(accessToken);
      setFetchedSources(filterApiConfigSources(config.sources));
    } catch (e) {
      setFetchedSources([]);
      setError(e instanceof Error ? e.message : "Failed to load scraper providers.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, externalSources]);

  useEffect(() => {
    if (externalSources) {
      setLoading(false);
      setError(null);
      return;
    }
    void refresh();
  }, [externalSources, refresh]);

  const sources = useMemo(
    () => externalSources ?? fetchedSources,
    [externalSources, fetchedSources],
  );

  const controlRows = useMemo(() => buildScraperRunControlRows(sources), [sources]);
  const filterOptions = useMemo(() => buildScraperRunLogFilterOptions(sources), [sources]);

  return {
    sources,
    controlRows,
    filterOptions,
    loading,
    error,
    refresh,
  };
}
