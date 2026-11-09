/**
 * Admin notification inbox API client.
 *
 * FE handover (bell UI):
 * - Poll `getAdminNotificationsUnreadCount` on an interval (or subscribe to
 *   realtime `notification.created`) and show a badge in the shell header.
 * - Dropdown/list: `listAdminNotifications({ unreadOnly?: boolean })`.
 * - On open/click item: `markAdminNotificationRead(id)`; "Mark all" →
 *   `markAllAdminNotificationsRead()`.
 * - Types live in `@/types/admin-notifications-api`.
 * - Credentials modal is unchanged here; vault secret display is a separate track.
 */
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { API_PATHS } from "@/lib/api-paths";
import type {
  AdminNotificationItem,
  AdminNotificationListResponse,
  AdminNotificationUnreadCount,
  MarkAllAdminNotificationsReadResponse,
} from "@/types/admin-notifications-api";

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeItem(raw: Record<string, unknown>): AdminNotificationItem {
  return {
    id: num(raw.id),
    type: str(raw.type),
    title: str(raw.title, "Notification"),
    body: str(raw.body) || null,
    severity: str(raw.severity, "info"),
    actor_user_id: raw.actor_user_id == null ? null : num(raw.actor_user_id),
    entity_type: str(raw.entity_type) || null,
    entity_id: str(raw.entity_id) || null,
    payload:
      typeof raw.payload === "object" && raw.payload !== null
        ? (raw.payload as Record<string, unknown>)
        : {},
    created_at: str(raw.created_at),
    read_at: str(raw.read_at) || null,
    dismissed_at: str(raw.dismissed_at) || null,
  };
}

export async function listAdminNotifications(
  token: string,
  params: { unreadOnly?: boolean; page?: number; pageSize?: number } = {},
): Promise<AdminNotificationListResponse> {
  const search = new URLSearchParams();
  if (params.unreadOnly) search.set("unread_only", "true");
  if (params.page != null) search.set("page", String(params.page));
  if (params.pageSize != null) search.set("page_size", String(params.pageSize));
  const qs = search.toString();
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    `${API_PATHS.adminNotifications.base}${qs ? `?${qs}` : ""}`,
  );
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  return {
    items: itemsRaw
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map(normalizeItem),
    total: num(raw.total),
    page: num(raw.page, 1),
    page_size: num(raw.page_size, 50),
  };
}

export async function getAdminNotificationsUnreadCount(
  token: string,
): Promise<AdminNotificationUnreadCount> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminNotifications.unreadCount,
  );
  return { unread_count: num(raw.unread_count) };
}

export async function markAdminNotificationRead(
  token: string,
  notificationId: number,
): Promise<AdminNotificationItem> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminNotifications.read(notificationId),
    { method: "POST" },
  );
  return normalizeItem(raw);
}

export async function markAllAdminNotificationsRead(
  token: string,
): Promise<MarkAllAdminNotificationsReadResponse> {
  const raw = await fetchAuthedJson<Record<string, unknown>>(
    token,
    API_PATHS.adminNotifications.readAll,
    { method: "POST" },
  );
  return { updated: num(raw.updated) };
}
