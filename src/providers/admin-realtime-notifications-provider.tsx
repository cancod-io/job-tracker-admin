"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ToastBanner } from "@/components/ui/toast-banner";
import { useToast } from "@/hooks/use-toast";
import {
  formatBadgeCount,
  realtimeBadgeKeyForHref,
  realtimeBadgeKeyForPathname,
  type RealtimeNavBadgeKey,
} from "@/lib/admin-realtime-badges";
import { listAdminUsers } from "@/lib/admin-user-api";
import { formatUserUpdatedToast, REALTIME_USER_UPDATED_EVENT } from "@/lib/realtime-sync-events";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import type { UserUpdatedPayload } from "@/types/realtime";

type IncrementalBadgeKey = Exclude<RealtimeNavBadgeKey, "users">;

type AdminRealtimeNotificationsContextValue = {
  getBadgeCountForHref: (href: string) => number;
};

const AdminRealtimeNotificationsContext =
  createContext<AdminRealtimeNotificationsContextValue | null>(null);

const INITIAL_BADGES: Record<IncrementalBadgeKey, number> = {
  jobs: 0,
  analytics: 0,
  "api-config": 0,
};

function isDocumentVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

function isOnUsersPage(pathname: string): boolean {
  return pathname === "/users" || pathname.startsWith("/users/");
}

export function AdminRealtimeNotificationsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { accessToken } = useAuth();
  const { can, loading: permissionsLoading } = useAdminPermissions();
  const canViewUsers = !permissionsLoading && can("users.read");
  const { toast, setToast } = useToast(6000);
  const [badges, setBadges] = useState(INITIAL_BADGES);
  const [usersPendingCount, setUsersPendingCount] = useState(0);
  const usersPendingCountRef = useRef(0);

  const clearBadge = useCallback((key: IncrementalBadgeKey) => {
    setBadges((prev) => (prev[key] === 0 ? prev : { ...prev, [key]: 0 }));
  }, []);

  const adjustUsersPendingCount = useCallback((delta: number) => {
    setUsersPendingCount((prev) => {
      const next = Math.max(0, prev + delta);
      usersPendingCountRef.current = next;
      return next;
    });
  }, []);

  const refreshUsersPendingCount = useCallback(async () => {
    if (!accessToken || !canViewUsers) {
      setUsersPendingCount(0);
      usersPendingCountRef.current = 0;
      return;
    }

    try {
      const body = await listAdminUsers(accessToken, {
        approval_status: "pending",
        page: 1,
        page_size: 1,
      });
      setUsersPendingCount(body.total);
      usersPendingCountRef.current = body.total;
    } catch {
      /* keep prior count */
    }
  }, [accessToken, canViewUsers]);

  useEffect(() => {
    void refreshUsersPendingCount();
  }, [refreshUsersPendingCount]);

  useEffect(() => {
    const activeKey = realtimeBadgeKeyForPathname(pathname);
    if (activeKey && activeKey !== "users") clearBadge(activeKey);
  }, [pathname, clearBadge]);

  useEffect(() => {
    const onUserUpdated = (event: Event) => {
      const payload = (event as CustomEvent<UserUpdatedPayload>).detail;
      if (!payload) return;

      if (payload.approval_status === "pending") {
        adjustUsersPendingCount(1);
      } else if (
        payload.approval_status === "approved" ||
        payload.approval_status === "rejected"
      ) {
        adjustUsersPendingCount(-1);
      }

      if (!isDocumentVisible() || isOnUsersPage(pathname)) return;

      const isPendingRegistration = payload.approval_status === "pending";
      if (isPendingRegistration) {
        setToast({
          kind: "info",
          title: "Users",
          message: formatUserUpdatedToast(payload),
        });
      }
    };

    window.addEventListener(REALTIME_USER_UPDATED_EVENT, onUserUpdated);

    return () => {
      window.removeEventListener(REALTIME_USER_UPDATED_EVENT, onUserUpdated);
    };
  }, [pathname, adjustUsersPendingCount, setToast]);

  const getBadgeCountForHref = useCallback(
    (href: string) => {
      if (href === "/users") return usersPendingCount;
      const key = realtimeBadgeKeyForHref(href);
      return key && key !== "users" ? badges[key] : 0;
    },
    [badges, usersPendingCount],
  );

  const value = useMemo(
    () => ({
      getBadgeCountForHref,
    }),
    [getBadgeCountForHref],
  );

  return (
    <AdminRealtimeNotificationsContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          className="pointer-events-none fixed right-4 top-[4.5rem] z-[60] w-[min(26rem,calc(100vw-2rem))] md:top-20"
          role="region"
          aria-live="polite"
          aria-label="Realtime notifications"
        >
          <ToastBanner
            toast={toast}
            layout="floating"
            onDismiss={() => setToast(null)}
            className="pointer-events-auto shadow-2xl"
          />
        </div>
      ) : null}
    </AdminRealtimeNotificationsContext.Provider>
  );
}

export function useAdminRealtimeNotifications(): AdminRealtimeNotificationsContextValue {
  const context = useContext(AdminRealtimeNotificationsContext);
  if (!context) {
    throw new Error(
      "useAdminRealtimeNotifications must be used within AdminRealtimeNotificationsProvider",
    );
  }
  return context;
}

export function useRealtimeNavBadge(href: string): string | null {
  const { getBadgeCountForHref } = useAdminRealtimeNotifications();
  const count = getBadgeCountForHref(href);
  if (count <= 0) return null;
  return formatBadgeCount(count);
}
