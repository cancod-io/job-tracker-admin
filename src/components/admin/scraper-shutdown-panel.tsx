"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Power,
  X,
} from "lucide-react";
import { getExitInfo, gracefulShutdown } from "@/lib/scraper-api";
import type { ExitInfoResponse } from "@/types/scraper-api";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScraperShutdownPanel() {
  // ── GET /exit ──
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoData, setInfoData] = useState<ExitInfoResponse | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  // ── POST /exit ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shutdownLoading, setShutdownLoading] = useState(false);
  const [shutdownDone, setShutdownDone] = useState(false);
  const [shutdownMessage, setShutdownMessage] = useState<string | null>(null);

  const fetchInfo = async () => {
    setInfoLoading(true);
    setInfoError(null);
    try {
      const data = await getExitInfo();
      setInfoData(data);
    } catch (e) {
      setInfoError(e instanceof Error ? e.message : "Failed to fetch exit info");
    } finally {
      setInfoLoading(false);
    }
  };

  const doShutdown = async () => {
    setConfirmOpen(false);
    setShutdownLoading(true);
    try {
      const { message } = await gracefulShutdown();
      setShutdownMessage(message);
    } finally {
      setShutdownDone(true);
      setShutdownLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-destructive/35 bg-card shadow-sm">
      {/* ── Header ── */}
      <div className="rounded-t-2xl border-b border-destructive/25 bg-destructive/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
            <Power className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">System Controls</h2>
            <p className="text-xs text-muted-foreground">
              Server lifecycle management — use with caution
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="space-y-4 p-5">
        {/* Warning */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Graceful shutdown closes the HTTP server and Postgres connection pool, then exits the
            Node.js process.{" "}
            <strong className="font-semibold">Any running ingest will be interrupted.</strong>{" "}
            Only trigger this when all ingests have completed.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* ── GET /exit ── */}
          <div className="flex flex-1 flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Step 1 — Read shutdown info
            </h3>
            <button
              type="button"
              onClick={() => void fetchInfo()}
              disabled={infoLoading}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-border/80 bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              {infoLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <FileText className="size-4" aria-hidden />
              )}
              {infoLoading ? "Fetching…" : "Get Shutdown Info"}
            </button>

            {infoError ? (
              <p className="text-xs text-destructive">{infoError}</p>
            ) : infoData ? (
              <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <div className="space-y-1">
                  {infoData.message && <p>{infoData.message}</p>}
                  <p className="opacity-75">
                    To shut down: send a <code className="rounded bg-muted px-1 py-0.5">{infoData.method}</code> request to{" "}
                    <code className="rounded bg-muted px-1 py-0.5">{infoData.path}</code>.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* ── POST /exit ── */}
          <div className="flex flex-col gap-2 sm:w-72">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Step 2 — Trigger shutdown
            </h3>

            {shutdownDone ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Shutdown signal sent</p>
                  {shutdownMessage ? (
                    <p className="mt-0.5 text-xs opacity-80">{shutdownMessage}</p>
                  ) : null}
                  <p className="mt-1 text-xs opacity-60">
                    The server may now be offline. Restart it manually.
                  </p>
                </div>
              </div>
            ) : confirmOpen ? (
              <ConfirmShutdown
                loading={shutdownLoading}
                onConfirm={() => void doShutdown()}
                onCancel={() => setConfirmOpen(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 self-start rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
              >
                <Power className="size-4" aria-hidden />
                Graceful Shutdown
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirmation dialog (inline)
// ---------------------------------------------------------------------------

function ConfirmShutdown({
  loading,
  onConfirm,
  onCancel,
}: {
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-destructive/40 bg-destructive/5 p-4"
      role="alertdialog"
      aria-label="Confirm graceful shutdown"
    >
      <p className="text-sm font-semibold text-foreground">Confirm graceful shutdown?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        The HTTP server and database pool will close and the Node.js process will exit. You must
        restart it manually to bring the scraper back online.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Power className="size-3.5" aria-hidden />
          )}
          {loading ? "Shutting down…" : "Yes, shut down"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          <X className="size-3.5" aria-hidden />
          Cancel
        </button>
      </div>
    </div>
  );
}
