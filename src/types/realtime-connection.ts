export type RealtimeConnectionStatus =
  | "unavailable"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "disabled";

export type RealtimeStatusMeta = {
  closeCode?: number;
  closeReason?: string;
  retryInMs?: number;
};
