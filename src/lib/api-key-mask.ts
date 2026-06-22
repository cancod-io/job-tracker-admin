/** Visible trailing characters when masking a secret in the UI. */
export const API_KEY_MASK_SUFFIX_LENGTH = 4;

/** Mask a secret for list display, e.g. `••••6789`. */
export function maskApiKeyDisplay(
  value: string,
  visibleSuffix = API_KEY_MASK_SUFFIX_LENGTH,
): string {
  const trimmed = value.trim();
  if (!trimmed) return "••••";
  const suffixLen = Math.min(visibleSuffix, trimmed.length);
  const suffix = trimmed.slice(-suffixLen);
  return `${"•".repeat(4)}${suffix}`;
}
