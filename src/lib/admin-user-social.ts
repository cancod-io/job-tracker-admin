import type { AdminUserSocialFields, AdminUserSocialLink } from "@/types/admin-user-api";

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function platformMatches(platform: string, keywords: string[]): boolean {
  const p = platform.toLowerCase();
  return keywords.some((k) => p.includes(k));
}

export function resolveSocialFields(
  raw: Record<string, unknown>,
  socialLinks: AdminUserSocialLink[],
  website: string | null,
): AdminUserSocialFields {
  const fields: AdminUserSocialFields = {
    linkedin_url: strOrNull(raw.linkedin_url),
    twitter_url: strOrNull(raw.twitter_url),
    github_url: strOrNull(raw.github_url),
    portfolio_url: strOrNull(raw.portfolio_url ?? raw.website ?? raw.website_url) ?? website,
  };

  for (const link of socialLinks) {
    const url = link.url.trim();
    if (!url) continue;
    if (!fields.linkedin_url && platformMatches(link.platform, ["linkedin"])) {
      fields.linkedin_url = url;
    }
    if (!fields.twitter_url && platformMatches(link.platform, ["twitter", "x"])) {
      fields.twitter_url = url;
    }
    if (!fields.github_url && platformMatches(link.platform, ["github"])) {
      fields.github_url = url;
    }
    if (
      !fields.portfolio_url &&
      platformMatches(link.platform, ["portfolio", "website", "personal"])
    ) {
      fields.portfolio_url = url;
    }
  }

  return fields;
}

export function hasAnySocialLink(social: AdminUserSocialFields): boolean {
  return Boolean(
    social.linkedin_url || social.twitter_url || social.github_url || social.portfolio_url,
  );
}
