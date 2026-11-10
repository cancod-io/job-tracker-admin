"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import {
  formatConnectionUptime,
  formatRetryCountdown,
  presentationForStatus,
} from "@/lib/realtime-connection-ui";
import { cn } from "@/lib/utils";
import { useRealtimeConnection } from "@/providers/admin-realtime-provider";

function ConnectionPanel({
  onReconnect,
  manualSpin,
  close,
}: {
  onReconnect: () => void;
  manualSpin: boolean;
  close: () => void;
}) {
  const { status, retryInMs, connectedAt, lastCloseCode, lastCloseReason, reconnect } =
    useRealtimeConnection();
  const presentation = presentationForStatus(status);
  const [now, setNow] = useState(() => Date.now());
  const retryStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (status === "reconnecting" && retryInMs != null) {
      if (retryStartedAtRef.current == null) {
        retryStartedAtRef.current = Date.now();
      }
      return;
    }
    retryStartedAtRef.current = null;
  }, [status, retryInMs]);

  const retrySeconds =
    status === "reconnecting" && retryInMs != null
      ? formatRetryCountdown(retryInMs, now, retryStartedAtRef.current ?? undefined)
      : null;

  const retryProgress =
    status === "reconnecting" && retryInMs != null && retryStartedAtRef.current != null
      ? Math.min(1, (now - retryStartedAtRef.current) / retryInMs)
      : 0;

  return (
    <div className="w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      <div className="border-b border-border/80 bg-gradient-to-br from-primary/5 via-transparent to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background">
            <Radio className="size-4 text-primary" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Admin live feed</p>
            <p className="text-xs text-muted-foreground">Scraper runs, jobs &amp; analytics</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex items-start gap-3">
          <span
            className={cn("mt-1 size-2.5 shrink-0 rounded-full", presentation.dotClass)}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">{presentation.label}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {presentation.description}
            </p>
          </div>
        </div>

        {status === "connected" && connectedAt != null ? (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">
              Session uptime
            </p>
            <p className="font-mono text-sm tabular-nums text-emerald-800 dark:text-emerald-200">
              {formatConnectionUptime(connectedAt, now)}
            </p>
          </div>
        ) : null}

        {status === "reconnecting" && retryInMs != null ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Auto-retry</span>
              <span className="font-mono tabular-nums">
                {retrySeconds === 0 ? "Now…" : `${retrySeconds}s`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-400 transition-[width] duration-1000 ease-linear"
                style={{ width: `${retryProgress * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {lastCloseCode != null || lastCloseReason ? (
          <p className="rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            {lastCloseCode != null ? (
              <span className="font-mono text-foreground/80">Code {lastCloseCode}</span>
            ) : null}
            {lastCloseCode != null && lastCloseReason ? " · " : null}
            {lastCloseReason ?? "Connection closed"}
          </p>
        ) : null}

        {presentation.canReconnect ? (
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => {
              onReconnect();
              reconnect();
              close();
            }}
          >
            <RefreshCw
              className={cn("size-4", (manualSpin || status === "connecting") && "animate-spin")}
              aria-hidden
            />
            Reconnect now
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function RealtimeConnectionIndicator() {
  const { status, enabled } = useRealtimeConnection();
  const [manualSpin, setManualSpin] = useState(false);

  if (!enabled) return null;

  const presentation = presentationForStatus(status);
  const isLive = status === "connected";
  const isBusy = status === "connecting" || status === "reconnecting";

  const handleManualReconnect = () => {
    setManualSpin(true);
    window.setTimeout(() => setManualSpin(false), 1200);
  };

  return (
    <Popover
      align="end"
      panelClassName="z-[300]"
      button={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={`Live connection: ${presentation.label}`}
          className={cn(
            "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl border px-2.5 text-xs font-medium shadow-sm transition-colors sm:min-w-0 sm:px-3",
            presentation.pillClass,
            open && "ring-2 ring-primary/20",
            isBusy && "animate-[pulse_2.5s_ease-in-out_infinite]",
          )}
        >
          <span
            className="relative flex size-2.5 shrink-0 items-center justify-center sm:size-2"
            aria-hidden
          >
            {isLive ? (
              <span className="absolute inline-flex size-3.5 animate-ping rounded-full bg-emerald-400/50 sm:size-3" />
            ) : null}
            <span
              className={cn("relative size-2.5 rounded-full sm:size-2", presentation.dotClass)}
            />
          </span>
          <span className="hidden sm:inline">{presentation.shortLabel}</span>
          <Radio className="size-3.5 shrink-0 opacity-70 sm:hidden" aria-hidden />
        </button>
      )}
    >
      {({ close }) => (
        <ConnectionPanel
          onReconnect={handleManualReconnect}
          manualSpin={manualSpin}
          close={close}
        />
      )}
    </Popover>
  );
}
