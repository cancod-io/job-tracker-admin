import type { ApiConfigSource } from "@/types/api-config-api";

/** API key source ids that map to two scraper run providers (ATS + Job Board). */
const FANTASTIC_SOURCE_IDS = new Set(["fantastic_jobs", "fantastic"]);

const FANTASTIC_SCRAPER_PROVIDERS = [
  { provider: "fantastic", label: "Fantastic Jobs — ATS" },
  { provider: "fantastic_jb", label: "Fantastic Jobs — Job Board" },
] as const;

const PROVIDER_LABEL_OVERRIDES: Record<string, string> = {
  serpapi: "SerpAPI",
  theirstack: "TheirStack",
};

export type ScraperRunControlRow = {
  provider: string;
  label: string;
  /** API key source id for key checks. */
  sourceId: string;
  canRun: boolean;
};

export type ScraperRunFilterOption = { value: string; label: string };

function isFantasticSource(source: ApiConfigSource): boolean {
  return FANTASTIC_SOURCE_IDS.has(source.id);
}

function labelForSource(source: ApiConfigSource): string {
  return PROVIDER_LABEL_OVERRIDES[source.id] ?? source.label ?? source.id;
}

/**
 * Build scraper run control rows from API config sources.
 * Fantastic (single API key source) expands into ATS + Job Board runs.
 * Other sources (SerpAPI, TheirStack, …) map 1:1 to a run provider.
 */
export function buildScraperRunControlRows(sources: ApiConfigSource[]): ScraperRunControlRow[] {
  const rows: ScraperRunControlRow[] = [];

  for (const source of sources) {
    if (isFantasticSource(source)) {
      for (const entry of FANTASTIC_SCRAPER_PROVIDERS) {
        rows.push({
          provider: entry.provider,
          label: entry.label,
          sourceId: source.id,
          canRun: source.is_set,
        });
      }
      continue;
    }

    rows.push({
      provider: source.id,
      label: labelForSource(source),
      sourceId: source.id,
      canRun: source.is_set,
    });
  }

  return rows;
}

/** Provider filter options for run log tables, derived from API sources. */
export function buildScraperRunLogFilterOptions(
  sources: ApiConfigSource[],
): ScraperRunFilterOption[] {
  const providerRows = buildScraperRunControlRows(sources);
  return [
    { value: "all", label: "All providers" },
    ...providerRows.map((row) => ({ value: row.provider, label: row.label })),
  ];
}

export function formatScraperProviderLabel(provider: string): string {
  switch (provider) {
    case "serpapi":
      return "SerpAPI";
    case "fantastic":
      return "Fantastic Jobs — ATS";
    case "fantastic_jb":
      return "Fantastic Jobs — Job Board";
    case "theirstack":
      return "TheirStack";
    case "all":
      return "All providers";
    default:
      return provider
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

export function isActiveScraperRunStatus(status: string): boolean {
  return status === "queued" || status === "running";
}

export function isTerminalScraperRunStatus(status: string): boolean {
  return status === "success" || status === "failed" || status === "cancelled";
}

/** Whether a run applies to a single-provider control row. */
export function scraperRunAppliesToProvider(runProvider: string, rowProvider: string): boolean {
  if (rowProvider === "all") return true;
  return runProvider === rowProvider || runProvider === "all";
}

export function formatScraperRunDuration(durationMs: number | null | undefined): string {
  if (durationMs == null || !Number.isFinite(durationMs)) return "—";
  if (durationMs < 1000) return `${durationMs}ms`;
  const totalSeconds = Math.round(durationMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export function formatScraperRunResultToast(run: {
  provider: string;
  status: string;
  added_count: number;
  blocked_count?: number;
  error_message: string | null;
}): string | null {
  const label = formatScraperProviderLabel(run.provider);
  if (run.status === "success") {
    if (run.added_count === 0) {
      const blockedNote =
        run.blocked_count != null && run.blocked_count > 0
          ? ` (${run.blocked_count} blocked)`
          : "";
      return `${label} finished — no new jobs; all apply URLs already exist${blockedNote}.`;
    }
    const blockedNote =
      run.blocked_count != null && run.blocked_count > 0
        ? ` · ${run.blocked_count} blocked`
        : "";
    return `${label} finished — ${run.added_count} new job${run.added_count === 1 ? "" : "s"} added${blockedNote}.`;
  }
  if (run.status === "failed") {
    return run.error_message
      ? `${label} failed — ${run.error_message}`
      : `${label} run failed.`;
  }
  if (run.status === "cancelled") {
    return `${label} run was cancelled.`;
  }
  return null;
}

export function isFantasticApiKeyConfigured(
  sources: { id: string; is_set: boolean }[],
): boolean {
  return sources.some((source) => FANTASTIC_SOURCE_IDS.has(source.id) && source.is_set);
}
