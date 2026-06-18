import type { ScamUrlType } from "@/types/scam-url-api";

/** API reason values with user-facing labels (values are stored on the backend). */
export const BLOCK_LIST_REASON_OPTIONS = [
  { value: "Scam website", label: "Blocked website" },
  { value: "Fake job postings", label: "Fake job postings" },
  { value: "Phishing site", label: "Phishing site" },
  { value: "Fraudulent recruiter", label: "Fraudulent recruiter" },
  { value: "Other", label: "Other" },
] as const;

/** Stored reason values sent to the API. */
export const SCAM_URL_REASONS = BLOCK_LIST_REASON_OPTIONS.map((option) => option.value);

export type ScamUrlReason = (typeof BLOCK_LIST_REASON_OPTIONS)[number]["value"];

export function formatBlockListReason(reason: string): string {
  const match = BLOCK_LIST_REASON_OPTIONS.find((option) => option.value === reason);
  return match?.label ?? reason;
}

export const SCAM_URL_TYPE_OPTIONS: { value: ScamUrlType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "domain", label: "Domain" },
  { value: "url", label: "URL" },
];

export function formatScamUrlType(type: ScamUrlType): string {
  return type === "domain" ? "Domain" : "URL";
}

export function displayUrlHref(url: string, urlType: ScamUrlType): string {
  if (urlType === "url" || /^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
