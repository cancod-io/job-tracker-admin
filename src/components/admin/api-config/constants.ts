/** Accent styles for known job-source slugs in the API config UI. */
export const SOURCE_ACCENTS: Record<string, { gradient: string; dot: string }> = {
  serpapi: {
    gradient: "from-orange-500/12 via-card to-card border-orange-500/25",
    dot: "bg-orange-500",
  },
};

export const DEFAULT_SOURCE_ACCENT = {
  gradient: "from-primary/10 via-card to-card border-primary/20",
  dot: "bg-primary",
};

export function sourceAccent(sourceId: string) {
  return SOURCE_ACCENTS[sourceId] ?? DEFAULT_SOURCE_ACCENT;
}

export function formatCredits(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (Number.isFinite(num)) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
  }
  return value;
}

/** Numeric value for client-side credits sorting. */
export function parseCreditsNumeric(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
