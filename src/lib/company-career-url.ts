import { createCareerUrl, listCareerUrls } from "@/lib/career-url-api";

/** Normalize URLs for duplicate checks (trim, lowercase host, drop trailing slash). */
export function normalizeCareerUrlForCompare(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\/$/, "") || "";
    return `${u.protocol}//${u.host.toLowerCase()}${path}${u.search}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

/**
 * Returns the career URL record id for a company.
 * Reuses an existing Career URLs row when the URL matches; otherwise creates one.
 */
export async function findOrCreateCareerUrlId(
  token: string,
  careerPageUrl: string,
): Promise<number | null> {
  const trimmed = careerPageUrl.trim();
  if (!trimmed) return null;

  const target = normalizeCareerUrlForCompare(trimmed);
  const result = await listCareerUrls(token, { page: 1, page_size: 100, q: trimmed });
  const existing = result.items.find(
    (item) => normalizeCareerUrlForCompare(item.career_url) === target,
  );
  if (existing) return existing.id;

  const created = await createCareerUrl(token, { career_url: trimmed });
  return created.id;
}
