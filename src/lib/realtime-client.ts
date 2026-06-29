import { buildRealtimeWsUrl } from "@/lib/realtime-ws-url";
import type { RealtimeConnectionStatus, RealtimeStatusMeta } from "@/types/realtime-connection";
import type { RealtimeEvent, RealtimeOutboundMessage } from "@/types/realtime";

export const WS_CLOSE_AUTH = 4401;
export const WS_CLOSE_DISABLED = 4403;

export const PING_INTERVAL_MS = 30_000;
export const RECONNECT_INITIAL_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;

export const REALTIME_WS_OPEN_EVENT = "sjt-realtime-ws-open";

export type RealtimeEventHandlers = {
  onEvent: (event: RealtimeEvent) => void;
  onAuthError: () => void;
  onDisabled: () => void;
  onOpen?: () => void;
  onStatusChange?: (status: RealtimeConnectionStatus, meta?: RealtimeStatusMeta) => void;
};

function parseIncomingMessage(data: unknown): RealtimeEvent | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const type = record.type;
  if (typeof type !== "string") return null;

  const payload = record.payload;
  if (payload == null || typeof payload !== "object") return null;

  return {
    id: typeof record.id === "string" ? record.id : "",
    type,
    ts: typeof record.ts === "string" ? record.ts : new Date().toISOString(),
    payload: payload as Record<string, unknown>,
  };
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
    this.emitStatus("disconnected");
  }

  reconnect(): void {
    if (!this.accessToken || !this.handlers) return;
    this.intentionalClose = false;
    this.disabled = false;
    this.reconnectDelay = RECONNECT_INITIAL_MS;
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.openSocket();
  }

  send(message: RealtimeOutboundMessage | Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(message));
  }

  private emitStatus(status: RealtimeConnectionStatus, meta?: RealtimeStatusMeta): void {
    this.handlers?.onStatusChange?.(status, meta);
  }

  private openSocket(): void {
    if (this.intentionalClose || this.disabled || !this.handlers || !this.accessToken) return;

    this.emitStatus("connecting");

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
      this.emitStatus("connected");
      this.handlers?.onOpen?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(REALTIME_WS_OPEN_EVENT));
      }
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

      const event = parseIncomingMessage(data);
      if (event) {
        this.handlers?.onEvent(event);
      }
    };

    socket.onclose = (evt) => {
      this.stopPing();
      this.ws = null;

      if (this.intentionalClose) return;

      if (evt.code === WS_CLOSE_AUTH) {
        this.emitStatus("disconnected", {
          closeCode: evt.code,
          closeReason: evt.reason || "Authentication required",
        });
        this.handlers?.onAuthError();
        return;
      }
      if (evt.code === WS_CLOSE_DISABLED) {
        this.disabled = true;
        this.emitStatus("disabled", {
          closeCode: evt.code,
          closeReason: evt.reason || "Realtime disabled",
        });
        this.handlers?.onDisabled();
        return;
      }

      this.scheduleReconnect({
        closeCode: evt.code,
        closeReason: evt.reason || undefined,
      });
    };

    socket.onerror = () => {
      /* close handler drives reconnect */
    };
  }

  private scheduleReconnect(meta?: RealtimeStatusMeta): void {
    if (this.intentionalClose || this.disabled || !this.handlers) return;
    this.clearReconnectTimer();
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS);
    this.emitStatus("reconnecting", { ...meta, retryInMs: delay });
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
