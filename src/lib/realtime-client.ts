import { buildRealtimeWsUrl } from "@/lib/realtime-ws-url";
import { realtimeLog, realtimeWarn, redactRealtimeWsUrl } from "@/lib/realtime-log";
import type { RealtimeEvent } from "@/types/realtime";

export const WS_CLOSE_AUTH = 4401;
export const WS_CLOSE_DISABLED = 4403;

export const PING_INTERVAL_MS = 30_000;
export const RECONNECT_INITIAL_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;

export type RealtimeEventHandlers = {
  onEvent: (event: RealtimeEvent) => void;
  onAuthError: () => void;
  onDisabled: () => void;
  onOpen?: () => void;
};

function isRealtimeEvent(data: unknown): data is RealtimeEvent {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.type === "string" &&
    typeof record.ts === "string" &&
    record.payload != null &&
    typeof record.payload === "object"
  );
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private pingTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectDelay = RECONNECT_INITIAL_MS;
  private intentionalClose = false;
  private disabled = false;
  private accessToken = "";
  private handlers: RealtimeEventHandlers | null = null;

  connect(accessToken: string, handlers: RealtimeEventHandlers): void {
    this.intentionalClose = false;
    this.disabled = false;
    this.accessToken = accessToken;
    this.handlers = handlers;
    this.clearReconnectTimer();
    realtimeLog("connecting…");
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    realtimeLog("disconnect requested");
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private openSocket(): void {
    if (this.intentionalClose || this.disabled || !this.handlers || !this.accessToken) return;

    const wsUrl = buildRealtimeWsUrl(this.accessToken);
    realtimeLog("opening socket", redactRealtimeWsUrl(wsUrl));

    let socket: WebSocket;
    try {
      socket = new WebSocket(wsUrl);
    } catch (error) {
      realtimeWarn("failed to create WebSocket", error);
      this.scheduleReconnect();
      return;
    }

    this.ws = socket;

    socket.onopen = () => {
      this.reconnectDelay = RECONNECT_INITIAL_MS;
      realtimeLog("connected");
      this.startPing();
      this.handlers?.onOpen?.();
    };

    socket.onmessage = (evt) => {
      let data: unknown;
      try {
        data = JSON.parse(String(evt.data));
      } catch {
        realtimeWarn("ignored non-JSON message", evt.data);
        return;
      }

      if (!data || typeof data !== "object") return;
      const record = data as Record<string, unknown>;
      const msgType = record.type;

      if (msgType === "pong") {
        realtimeLog("pong");
        return;
      }

      if (msgType === "error") {
        realtimeWarn("server error", record);
        return;
      }

      if (isRealtimeEvent(data)) {
        realtimeLog(`event ← ${data.type}`, {
          id: data.id,
          ts: data.ts,
          payload: data.payload,
        });
        this.handlers?.onEvent(data);
        return;
      }

      realtimeWarn("ignored unknown message", record);
    };

    socket.onclose = (evt) => {
      this.stopPing();
      this.ws = null;
      realtimeWarn("connection closed", {
        code: evt.code,
        reason: evt.reason || null,
        wasClean: evt.wasClean,
      });

      if (this.intentionalClose) return;

      if (evt.code === WS_CLOSE_AUTH) {
        realtimeWarn("auth failed — refreshing session");
        this.handlers?.onAuthError();
        return;
      }
      if (evt.code === WS_CLOSE_DISABLED) {
        realtimeWarn("realtime disabled on server");
        this.disabled = true;
        this.handlers?.onDisabled();
        return;
      }

      this.scheduleReconnect();
    };

    socket.onerror = () => {
      realtimeWarn("socket error");
    };
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose || this.disabled || !this.handlers) return;
    this.clearReconnectTimer();
    const delay = this.reconnectDelay;
    realtimeLog(`reconnecting in ${delay}ms`);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = window.setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      realtimeLog("ping →");
      this.ws.send(JSON.stringify({ type: "ping" }));
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer != null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearTimers(): void {
    this.stopPing();
    this.clearReconnectTimer();
  }
}
