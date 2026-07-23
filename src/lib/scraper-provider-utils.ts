import type { ApiConfigSource } from "@/types/api-config-api";

const PROVIDER_LABEL_OVERRIDES: Record<string, string> = {
  serpapi: "SerpAPI",
  theirstack: "TheirStack",
};

/** Source / provider ids retired from the admin UI. */
const HIDDEN_SCRAPER_PROVIDER_IDS = new Set([
  "fantastic",
  "fantastic_jb",
  "fantastic_jobs",
]);

export type ScraperRunControlRow = {
  provider: string;
  label: string;
  /** API key source id for key checks. */
  sourceId: string;
  canRun: boolean;
};

export type ScraperRunFilterOption = { value: string; label: string };

function labelForSource(source: ApiConfigSource): string {
  return PROVIDER_LABEL_OVERRIDES[source.id] ?? source.label ?? source.id;
}

/** True for retired Fantastic Jobs providers (and label matches). */
export function isHiddenScraperProvider(id: string, label?: string | null): boolean {
  const trimmed = id.trim().toLowerCase();
  if (HIDDEN_SCRAPER_PROVIDER_IDS.has(trimmed) || HIDDEN_SCRAPER_PROVIDER_IDS.has(id)) {
    return true;
  }
  if (trimmed.startsWith("fantastic")) return true;
  if (label && /fantastic/i.test(label)) return true;
  return false;
}

/**
 * Build scraper run control rows from API config sources.
 * Each source maps 1:1 to a run provider (SerpAPI, TheirStack, …).
 */
export function buildScraperRunControlRows(sources: ApiConfigSource[]): ScraperRunControlRow[] {
  const rows: ScraperRunControlRow[] = [];

  for (const source of sources) {
    if (isHiddenScraperProvider(source.id)) continue;

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
