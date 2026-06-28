"use client";

import { useCallback, useEffect, useRef } from "react";
import { getStoredAccessToken } from "@/lib/auth-token";
import { RealtimeClient } from "@/lib/realtime-client";
import { routeRealtimeEvent } from "@/lib/realtime-sync-events";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import type { RealtimeEvent } from "@/types/realtime";

function sendRealtimeDataRequests(client: RealtimeClient, can: (key: string) => boolean): void {
  if (can("users.read")) {
    client.send({ type: "users.application_stats.request" });
  }
  if (can("stats.read")) {
    client.send({ type: "analytics.top_applicants.request" });
  }
}

export function AdminRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { status, user, accessToken, logout, refreshSession } = useAuth();
  const { can, loading: permissionsLoading } = useAdminPermissions();
  const clientRef = useRef<RealtimeClient | null>(null);
  const canRef = useRef(can);
  canRef.current = can;

  const onEvent = useCallback((event: RealtimeEvent) => {
    routeRealtimeEvent(event);
  }, []);

  const requestData = useCallback((client: RealtimeClient) => {
    if (permissionsLoading) return;
    sendRealtimeDataRequests(client, canRef.current);
  }, [permissionsLoading]);

  const canConnect =
    status === "authenticated" &&
    Boolean(accessToken) &&
    user?.approval_status === "approved";

  useEffect(() => {
    if (!canConnect || !accessToken) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      return;
    }

    const client = new RealtimeClient();
    clientRef.current = client;

    client.connect(accessToken, {
      onEvent,
      onOpen: () => requestData(client),
      onAuthError: () => {
        void (async () => {
          await refreshSession();
          if (!getStoredAccessToken()) {
            logout();
          }
        })();
      },
      onDisabled: () => {
        clientRef.current?.disconnect();
        clientRef.current = null;
      },
    });

    return () => {
      client.disconnect();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [canConnect, accessToken, onEvent, logout, refreshSession, requestData]);

  useEffect(() => {
    if (!canConnect || permissionsLoading) return;
    const client = clientRef.current;
    if (client) requestData(client);
  }, [canConnect, permissionsLoading, requestData]);

  useEffect(() => {
    if (!canConnect) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const client = clientRef.current;
      if (client) requestData(client);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [canConnect, requestData]);

  return children;
}
