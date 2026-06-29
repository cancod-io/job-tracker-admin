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
import { getStoredAccessToken } from "@/lib/auth-token";
import { RealtimeClient } from "@/lib/realtime-client";
import { routeRealtimeEvent } from "@/lib/realtime-sync-events";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import type { RealtimeEvent } from "@/types/realtime";
import type { RealtimeConnectionStatus, RealtimeStatusMeta } from "@/types/realtime-connection";

type RealtimeConnectionContextValue = {
  status: RealtimeConnectionStatus;
  retryInMs: number | null;
  connectedAt: number | null;
  lastCloseCode: number | null;
  lastCloseReason: string | null;
  reconnect: () => void;
  enabled: boolean;
};

const RealtimeConnectionContext = createContext<RealtimeConnectionContextValue | null>(null);

function sendRealtimeDataRequests(client: RealtimeClient, can: (key: string) => boolean): void {
  if (can("users.read")) {
    client.send({ type: "users.application_stats.request" });
  }
  if (can("stats.read")) {
    client.send({ type: "analytics.top_applicants.request" });
  }
}

export function useRealtimeConnection(): RealtimeConnectionContextValue {
  const ctx = useContext(RealtimeConnectionContext);
  if (!ctx) {
    return {
      status: "unavailable",
      retryInMs: null,
      connectedAt: null,
      lastCloseCode: null,
      lastCloseReason: null,
      reconnect: () => {},
      enabled: false,
    };
  }
  return ctx;
}

export function AdminRealtimeProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user, accessToken, logout, refreshSession } = useAuth();
  const { can, loading: permissionsLoading } = useAdminPermissions();
  const clientRef = useRef<RealtimeClient | null>(null);
  const canRef = useRef(can);
  canRef.current = can;

  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>("unavailable");
  const [retryInMs, setRetryInMs] = useState<number | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [lastCloseCode, setLastCloseCode] = useState<number | null>(null);
  const [lastCloseReason, setLastCloseReason] = useState<string | null>(null);

  const canConnect =
    authStatus === "authenticated" &&
    Boolean(accessToken) &&
    user?.approval_status === "approved";

  const showIndicator = authStatus === "authenticated" && Boolean(accessToken);

  const handleStatusChange = useCallback((status: RealtimeConnectionStatus, meta?: RealtimeStatusMeta) => {
    setConnectionStatus(status);
    setRetryInMs(meta?.retryInMs ?? null);
    if (meta?.closeCode != null) setLastCloseCode(meta.closeCode);
    if (meta?.closeReason) setLastCloseReason(meta.closeReason);
    if (status === "connected") {
      setConnectedAt(Date.now());
      setRetryInMs(null);
      setLastCloseCode(null);
      setLastCloseReason(null);
    }
  }, []);

  const onEvent = useCallback((event: RealtimeEvent) => {
    routeRealtimeEvent(event);
  }, []);

  const requestData = useCallback((client: RealtimeClient) => {
    if (permissionsLoading) return;
    sendRealtimeDataRequests(client, canRef.current);
  }, [permissionsLoading]);

  const reconnect = useCallback(() => {
    if (!canConnect) return;
    setConnectionStatus("connecting");
    setRetryInMs(null);
    const client = clientRef.current;
    if (client) {
      client.reconnect();
      return;
    }
    if (!accessToken) return;
    const newClient = new RealtimeClient();
    clientRef.current = newClient;
    newClient.connect(accessToken, {
      onEvent,
      onStatusChange: handleStatusChange,
      onOpen: () => requestData(newClient),
      onAuthError: () => {
        void (async () => {
          await refreshSession();
          if (!getStoredAccessToken()) logout();
        })();
      },
      onDisabled: () => {
        clientRef.current?.disconnect();
        clientRef.current = null;
      },
    });
  }, [canConnect, accessToken, onEvent, handleStatusChange, requestData, refreshSession, logout]);

  useEffect(() => {
    if (!canConnect || !accessToken) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setConnectionStatus("unavailable");
      setRetryInMs(null);
      return;
    }

    const client = new RealtimeClient();
    clientRef.current = client;

    client.connect(accessToken, {
      onEvent,
      onStatusChange: handleStatusChange,
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
  }, [canConnect, accessToken, onEvent, handleStatusChange, logout, refreshSession, requestData]);

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

  const connectionValue = useMemo<RealtimeConnectionContextValue>(
    () => ({
      status: canConnect ? connectionStatus : "unavailable",
      retryInMs: canConnect ? retryInMs : null,
      connectedAt: canConnect ? connectedAt : null,
      lastCloseCode: canConnect ? lastCloseCode : null,
      lastCloseReason: canConnect ? lastCloseReason : null,
      reconnect,
      enabled: showIndicator,
    }),
    [
      canConnect,
      showIndicator,
      connectionStatus,
      retryInMs,
      connectedAt,
      lastCloseCode,
      lastCloseReason,
      reconnect,
    ],
  );

  return (
    <RealtimeConnectionContext.Provider value={connectionValue}>
      {children}
    </RealtimeConnectionContext.Provider>
  );
}
