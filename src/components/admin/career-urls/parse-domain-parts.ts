/** Best-effort parse of `apex.example.com` and the leading sub-portion. */
export function parseDomainParts(rawUrl: string): {
  host: string;
  domain: string;
  subdomain: string;
} {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./i, "");
    const parts = host.split(".");
    if (parts.length <= 2) {
      return { host, domain: host, subdomain: "" };
    }
    const PUBLIC_SUFFIX_HINTS = new Set(["co", "com", "org", "net", "gov", "ac", "edu"]);
    const secondLast = parts[parts.length - 2] ?? "";
    const sliceFromEnd = PUBLIC_SUFFIX_HINTS.has(secondLast.toLowerCase()) ? 3 : 2;
    const domain = parts.slice(-sliceFromEnd).join(".");
    const subdomain = parts.slice(0, -sliceFromEnd).join(".");
    return { host, domain, subdomain };
  } catch {
    return { host: rawUrl, domain: rawUrl, subdomain: "" };
  }
}
