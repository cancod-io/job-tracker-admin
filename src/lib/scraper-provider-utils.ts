import type { ScraperRunProvider } from "@/types/scraper-runs-api";

/** UI rows for per-provider run controls (excludes hidden sources like Apify). */
export const SCRAPER_RUN_CONTROL_ROWS = [
  { provider: "serpapi" as const, label: "SerpAPI", sourceId: "serpapi" },
  { provider: "fantastic" as const, label: "Fantastic Jobs", sourceId: "fantastic_jobs" },
] as const;

export function formatScraperProviderLabel(provider: string): string {
  switch (provider) {
    case "serpapi":
      return "SerpAPI";
    case "fantastic":
      return "Fantastic Jobs";
    case "all":
      return "All providers";
    default:
      return provider;
  }
}

export function isActiveScraperRunStatus(status: string): boolean {
  return status === "queued" || status === "running";
}

export function isTerminalScraperRunStatus(status: string): boolean {
  return status === "success" || status === "failed" || status === "cancelled";
}

/** Whether a run applies to a single-provider control row. */
export function scraperRunAppliesToProvider(runProvider: string, rowProvider: ScraperRunProvider): boolean {
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
  updated_count: number;
  unchanged_count: number;
  error_message: string | null;
}): string | null {
  const label = formatScraperProviderLabel(run.provider);
  if (run.status === "success") {
    return `${label} finished — ${run.added_count} added, ${run.updated_count} updated, ${run.unchanged_count} unchanged.`;
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
