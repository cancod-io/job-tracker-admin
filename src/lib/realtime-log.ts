const LOG_PREFIX = "[TrackCod Admin Realtime]";

function isLoggingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const flag = process.env.NEXT_PUBLIC_REALTIME_LOG;
  if (flag === "false" || flag === "0") return false;
  return true;
}

export function redactRealtimeWsUrl(url: string): string {
  return url.replace(/token=[^&]+/i, "token=***");
}

export function realtimeLog(message: string, details?: unknown): void {
  if (!isLoggingEnabled()) return;
  if (details === undefined) {
    console.log(LOG_PREFIX, message);
    return;
  }
  console.log(LOG_PREFIX, message, details);
}

export function realtimeWarn(message: string, details?: unknown): void {
  if (!isLoggingEnabled()) return;
  if (details === undefined) {
    console.warn(LOG_PREFIX, message);
    return;
  }
  console.warn(LOG_PREFIX, message, details);
}
