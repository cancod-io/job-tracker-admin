import type { ScamUrlType } from "@/types/scam-url-api";

export const SCAM_URL_REASONS = [
  "Scam website",
  "Fake job postings",
  "Phishing site",
  "Fraudulent recruiter",
  "Other",
] as const;

export type ScamUrlReason = (typeof SCAM_URL_REASONS)[number];

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
