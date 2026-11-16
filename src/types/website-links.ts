/** Shared website links (`/api/admin/website-links`). */

export type WebsiteLink = {
  id: number;
  display_index: number;
  url: string;
  description: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export type WebsiteLinkListResponse = {
  items: WebsiteLink[];
  total: number;
};

export type WebsiteLinkCreateRequest = {
  display_index: number;
  url: string;
  description?: string | null;
};

export type WebsiteLinkUpdateRequest = {
  display_index?: number;
  url?: string;
  description?: string | null;
  clear_description?: boolean;
};
