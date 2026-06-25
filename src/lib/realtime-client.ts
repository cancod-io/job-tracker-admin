import { buildRealtimeWsUrl } from "@/lib/realtime-ws-url";
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
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private openSocket(): void {
    if (this.intentionalClose || this.disabled || !this.handlers || !this.accessToken) return;

    let socket: WebSocket;
    try {
      socket = new WebSocket(buildRealtimeWsUrl(this.accessToken));
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws = socket;

    socket.onopen = () => {
      this.reconnectDelay = RECONNECT_INITIAL_MS;
      this.startPing();
      this.handlers?.onOpen?.();
    };

    socket.onmessage = (evt) => {
      let data: unknown;
      try {
        data = JSON.parse(String(evt.data));
      } catch {
        return;
      }

      if (!data || typeof data !== "object") return;
      const record = data as Record<string, unknown>;
      const msgType = record.type;

      if (msgType === "pong" || msgType === "error") return;

      if (isRealtimeEvent(data)) {
        this.handlers?.onEvent(data);
      }
    };

    socket.onclose = (evt) => {
      this.stopPing();
      this.ws = null;

      if (this.intentionalClose) return;

      if (evt.code === WS_CLOSE_AUTH) {
        this.handlers?.onAuthError();
        return;
      }
      if (evt.code === WS_CLOSE_DISABLED) {
        this.disabled = true;
        this.handlers?.onDisabled();
        return;
      }

      this.scheduleReconnect();
    };

    socket.onerror = () => {
      /* close handler drives reconnect */
    };
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose || this.disabled || !this.handlers) return;
    this.clearReconnectTimer();
    const delay = this.reconnectDelay;
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
