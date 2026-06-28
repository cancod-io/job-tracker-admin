import type { AdminUserRow } from "@/types/admin-user-api";
import type { UserApplicationStatsItem } from "@/types/realtime";

export function mergeUserApplicationStats(
  users: AdminUserRow[],
  stats: UserApplicationStatsItem[],
): AdminUserRow[] {
  const byId = new Map(stats.map((item) => [item.user_id, item]));
  return users.map((user) => {
    const stat = byId.get(user.id);
    if (!stat) return user;
    return {
      ...user,
      application_count: stat.application_count,
      applications_today: stat.applications_today,
    };
  });
}
