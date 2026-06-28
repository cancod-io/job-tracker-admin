import { AdminUserDetailPage } from "@/components/admin/admin-user-detail-page";

type UserDetailRouteProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserDetailRoute({ params }: UserDetailRouteProps) {
  const { userId } = await params;
  const parsedId = Number.parseInt(userId, 10);
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return null;
  }
  return <AdminUserDetailPage userId={parsedId} />;
}
