import type { RealtimeConnectionStatus } from "@/types/realtime-connection";

export type RealtimeConnectionPresentation = {
  label: string;
  shortLabel: string;
  description: string;
  dotClass: string;
  pillClass: string;
  canReconnect: boolean;
};

export function presentationForStatus(
  status: RealtimeConnectionStatus,
): RealtimeConnectionPresentation {
  switch (status) {
    case "connected":
      return {
        label: "Connected",
        shortLabel: "Live",
        description: "Streaming scraper runs, job ingests, and analytics signals.",
        dotClass: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.65)]",
        pillClass: "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        canReconnect: false,
      };
    case "connecting":
      return {
        label: "Connecting…",
        shortLabel: "Connecting",
        description: "Opening the admin live channel.",
        dotClass: "bg-amber-400 animate-pulse",
        pillClass: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
        canReconnect: false,
      };
    case "reconnecting":
      return {
        label: "Reconnecting…",
        shortLabel: "Reconnecting",
        description: "Connection lost — retrying with backoff.",
        dotClass: "bg-amber-400 animate-pulse",
        pillClass: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
        canReconnect: true,
      };
    case "disconnected":
      return {
        label: "Disconnected",
        shortLabel: "Offline",
        description: "Admin live feed is paused until you reconnect.",
        dotClass: "bg-rose-500",
        pillClass: "border-rose-500/35 bg-rose-500/10 text-rose-800 dark:text-rose-200",
        canReconnect: true,
      };
    case "disabled":
      return {
        label: "Unavailable",
        shortLabel: "Off",
        description: "Real-time updates are disabled on the server.",
        dotClass: "bg-muted-foreground/50",
        pillClass: "border-border bg-muted text-muted-foreground",
        canReconnect: false,
      };
    default:
      return {
        label: "Unavailable",
        shortLabel: "Off",
        description: "Sign in with an approved account to enable live updates.",
        dotClass: "bg-muted-foreground/40",
        pillClass: "border-border bg-muted/60 text-muted-foreground",
        canReconnect: false,
      };
  }
}

export function formatConnectionUptime(connectedAt: number, now = Date.now()): string {
  const totalSec = Math.max(0, Math.floor((now - connectedAt) / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (totalSec < 3600) return `${mins}m ${secs}s`;
  const hours = Math.floor(totalSec / 3600);
  const remMins = Math.floor((totalSec % 3600) / 60);
  return `${hours}h ${remMins}m`;
}

export function formatRetryCountdown(
  retryInMs: number,
  now = Date.now(),
  startedAt?: number,
): number {
  if (startedAt == null) return Math.ceil(retryInMs / 1000);
  const elapsed = now - startedAt;
  return Math.max(0, Math.ceil((retryInMs - elapsed) / 1000));
}
