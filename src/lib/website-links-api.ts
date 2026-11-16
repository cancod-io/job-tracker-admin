/**
 * Shared website links (admin API — same list as the user app).
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { API_PATHS } from "@/lib/api-paths";
import type {
  WebsiteLink,
  WebsiteLinkCreateRequest,
  WebsiteLinkListResponse,
  WebsiteLinkUpdateRequest,
} from "@/types/website-links";

const BASE = API_PATHS.adminWebsiteLinks.base;

function normalizeLink(raw: Partial<WebsiteLink> & { id: number }): WebsiteLink {
  return {
    id: raw.id,
    display_index:
      typeof raw.display_index === "number" && Number.isFinite(raw.display_index)
        ? raw.display_index
        : 0,
    url: typeof raw.url === "string" ? raw.url : "",
    description: typeof raw.description === "string" ? raw.description : null,
    created_by_name: typeof raw.created_by_name === "string" ? raw.created_by_name : null,
    updated_by_name: typeof raw.updated_by_name === "string" ? raw.updated_by_name : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : new Date(0).toISOString(),
  };
}

export async function listWebsiteLinks(
  token: string,
  q?: string,
): Promise<WebsiteLinkListResponse> {
  const params = new URLSearchParams();
  const search = q?.trim();
  if (search) params.set("q", search);
  const path = params.toString() ? `${BASE}?${params}` : BASE;
  const raw = await fetchAuthedJson<{ items?: unknown; total?: unknown }>(token, path);
  const items = Array.isArray(raw.items)
    ? (raw.items as Array<Partial<WebsiteLink> & { id: number }>)
        .filter((row) => typeof row?.id === "number")
        .map(normalizeLink)
    : [];
  const total = typeof raw.total === "number" ? raw.total : items.length;
  return { items, total };
}

export async function createWebsiteLink(
  token: string,
  payload: WebsiteLinkCreateRequest,
): Promise<WebsiteLink> {
  const raw = await fetchAuthedJson<Partial<WebsiteLink> & { id: number }>(token, BASE, {
    method: "POST",
    body: payload,
  });
  return normalizeLink(raw);
}

export async function updateWebsiteLink(
  token: string,
  linkId: number,
  payload: WebsiteLinkUpdateRequest,
): Promise<WebsiteLink> {
  const raw = await fetchAuthedJson<Partial<WebsiteLink> & { id: number }>(
    token,
    API_PATHS.adminWebsiteLinks.detail(linkId),
    { method: "PUT", body: payload },
  );
  return normalizeLink(raw);
}

export async function deleteWebsiteLink(token: string, linkId: number): Promise<void> {
  await fetchAuthedJson<void>(token, API_PATHS.adminWebsiteLinks.detail(linkId), {
    method: "DELETE",
  });
}
