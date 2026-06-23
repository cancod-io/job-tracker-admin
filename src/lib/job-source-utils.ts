/**
 * Fallback when the API omits `source_label` (legacy responses).
 * Prefer `job.source_label` or `JobSourceOption.label` from GET /jobs/sources.
 */
export function formatJobSourceLabel(source: string, label?: string | null): string {
  const fromApi = label?.trim();
  if (fromApi) return fromApi;

  const trimmed = source.trim();
  if (!trimmed) return "";
  if (/^[a-z0-9_-]+$/.test(trimmed)) {
    return trimmed
      .split(/[_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }
  return trimmed;
}

export function jobSourceDisplayLabel(job: {
  source: string;
  source_label?: string | null;
}): string {
  return formatJobSourceLabel(job.source, job.source_label);
}
