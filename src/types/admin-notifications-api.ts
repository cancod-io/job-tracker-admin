/** Admin durable notification inbox DTOs (`/api/admin/notifications`). */

export type AdminNotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  severity: string;
  actor_user_id: number | null;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
};

export type AdminNotificationListResponse = {
  items: AdminNotificationItem[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminNotificationUnreadCount = {
  unread_count: number;
};

export type MarkAllAdminNotificationsReadResponse = {
  updated: number;
};
