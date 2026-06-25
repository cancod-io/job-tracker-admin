"use client";

import { useCallback, useEffect, useRef } from "react";
import { getStoredAccessToken } from "@/lib/auth-token";
import { RealtimeClient } from "@/lib/realtime-client";
import { routeRealtimeEvent } from "@/lib/realtime-sync-events";
import { useAuth } from "@/providers/auth-provider";
import type { RealtimeEvent } from "@/types/realtime";

export function AdminRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { status, user, accessToken, logout, refreshSession } = useAuth();
  const clientRef = useRef<RealtimeClient | null>(null);

  const onEvent = useCallback((event: RealtimeEvent) => {
    routeRealtimeEvent(event);
  }, []);

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
  }, [canConnect, accessToken, onEvent, logout, refreshSession]);

  return children;
}
