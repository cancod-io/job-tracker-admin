"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Loader2, RefreshCw, Terminal } from "lucide-react";
import { getAdminHelp } from "@/lib/scraper-api";
import { cn } from "@/lib/utils";
import type { AdminHelpResponse } from "@/types/scraper-api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const METHOD_BADGE: Record<string, string> = {
  GET:    "border-sky-500/30    bg-sky-500/10    text-sky-700    dark:text-sky-300",
  POST:   "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  PUT:    "border-amber-500/30  bg-amber-500/10  text-amber-700  dark:text-amber-300",
  PATCH:  "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  DELETE: "border-destructive/30 bg-destructive/10 text-destructive",
};

function methodClass(m: string) {
  return METHOD_BADGE[m.toUpperCase()] ?? "border-border bg-muted text-muted-foreground";
}

/** POST routes call external APIs; GET routes are local. */
function isExternal(method: string) {
  return method.toUpperCase() === "POST";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScraperHelpPanel() {
  const [open, setOpen]             = useState(false);
  const [data, setData]             = useState<AdminHelpResponse | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [fetchedAt, setFetchedAt]   = useState<Date | null>(null);

  const fetchHelp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminHelp();
      setData(res);
      setFetchedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach scraper service");
    } finally {
      setLoading(false);
    }
  }, []);

  // Lazy-load on first open
  useEffect(() => {
    if (open && !data && !loading) void fetchHelp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commands = data?.commands ?? [];
  const getCount  = commands.filter(c => c.method.toUpperCase() === "GET").length;
  const postCount = commands.filter(c => c.method.toUpperCase() === "POST").length;

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
      {/* ── Accordion trigger ── */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="help-panel-body"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">API Routes Reference</h2>
            <p className="text-xs text-muted-foreground">
              {data
                ? `${commands.length} endpoints · ${getCount} GET · ${postCount} POST`
                : "Click to load admin routes from the service"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
          {open ? <ChevronUp className="size-5 text-muted-foreground" aria-hidden /> : <ChevronDown className="size-5 text-muted-foreground" aria-hidden />}
        </div>
      </button>

      {/* ── Body ── */}
      {open && (
        <div id="help-panel-body" className="border-t border-border/60 p-5 space-y-4">

          {/* Info bar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {fetchedAt
                ? `Fetched from service at ${new Intl.DateTimeFormat(undefined, { timeStyle: "medium" }).format(fetchedAt)}`
                : error
                  ? error
                  : "Loading routes from scraper service…"}
            </p>
            <button
              type="button"
              onClick={() => void fetchHelp()}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3", loading && "animate-spin")} aria-hidden />
              Refresh
            </button>
          </div>

          {/* Message from service */}
          {data?.message && (
            <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {data.message}
            </p>
          )}

          {/* Error */}
          {error && !data && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {/* Routes table */}
          {commands.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="border-b border-border/60 bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Method</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Path</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Description</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">External</th>
                  </tr>
                </thead>
                <tbody>
                  {commands.map((cmd) => (
                    <tr key={`${cmd.method}-${cmd.path}`} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 align-top">
                        <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", methodClass(cmd.method))}>
                          {cmd.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{cmd.path}</code>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                        {cmd.description}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={cn("text-xs", isExternal(cmd.method) ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                          {isExternal(cmd.method) ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Note + CLI hint */}
          {(data?.note || data?.cliEquivalents?.length) && (
            <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4">
              {data.note && (
                <p className="text-xs text-muted-foreground">{data.note}</p>
              )}
              {data.cliEquivalents?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Terminal className="size-3.5 shrink-0" aria-hidden />
                  <span className="font-medium text-foreground">CLI commands:</span>
                  {data.cliEquivalents.map(cmd => (
                    <code key={cmd} className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{cmd}</code>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
