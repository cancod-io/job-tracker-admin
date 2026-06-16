import type { ScamUrlType } from "@/types/scam-url-api";

const DOMAIN_RE =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const URL_RE = /^https?:\/\/.+/i;

export function validateScamUrlInput(
  url: string,
  urlType: ScamUrlType,
): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "URL / Domain is required.";

  if (urlType === "domain") {
    const normalized = trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      ?.split("?")[0]
      ?.split("#")[0];

    if (!normalized || !DOMAIN_RE.test(normalized)) {
      return "Enter a valid domain (e.g. badjobs.com).";
    }
    return null;
  }

  if (!URL_RE.test(trimmed)) {
    return "Enter a full URL including http:// or https://.";
  }

  try {
    new URL(trimmed);
    return null;
  } catch {
    return "Enter a valid URL.";
  }
}
