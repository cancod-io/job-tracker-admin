"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { ConflictError, getMonitorStatus, runAllProviders, runJSearch, runSerpApi } from "@/lib/scraper-api";
import { cn } from "@/lib/utils";
import type { DatePostedFilter, IngestParams, IngestProvider, IngestResult } from "@/types/scraper-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IngestState =
  | { phase: "idle" }
  | { phase: "running";    provider: IngestProvider }
  | { phase: "checking";   provider: IngestProvider }   // drop detected, polling monitor
  | { phase: "running_bg"; provider: IngestProvider }   // proxy dropped but service is busy
  | { phase: "success";    provider: IngestProvider; result: IngestResult }
  | { phase: "conflict" }
  | { phase: "dropped";    provider: IngestProvider }   // drop + service idle (status unknown)
  | { phase: "error";      provider: IngestProvider; message: string };

type IngestAction = {
  provider: IngestProvider;
  label: string;
  description: string;
  activeColor: string;
  idleColor: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DATE_POSTED_OPTIONS: { value: DatePostedFilter; label: string }[] = [
  { value: "all",    label: "All time"    },
  { value: "today",  label: "Today"       },
  { value: "3days",  label: "Last 3 days" },
  { value: "week",   label: "Last week"   },
  { value: "month",  label: "Last month"  },
];

const INGEST_ACTIONS: IngestAction[] = [
  {
    provider:    "all",
    label:       "Run All Providers",
    description: "JSearch + SerpAPI",
    idleColor:   "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm",
    activeColor: "bg-primary/50 text-primary-foreground/60 cursor-not-allowed",
  },
  {
    provider:    "jsearch",
    label:       "JSearch Only",
    description: "RapidAPI · JSearch",
    idleColor:   "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm",
    activeColor: "bg-blue-600/50 dark:bg-blue-500/50 text-white/60 cursor-not-allowed",
  },
  {
    provider:    "serpapi",
    label:       "SerpAPI Only",
    description: "Google Jobs via SerpAPI",
    idleColor:   "bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-500 dark:hover:bg-violet-600 shadow-sm",
    activeColor: "bg-violet-600/50 dark:bg-violet-500/50 text-white/60 cursor-not-allowed",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function providerLabel(p: IngestProvider): string {
  if (p === "all")     return "All providers";
  if (p === "jsearch") return "JSearch";
  return "SerpAPI";
}

/**
 * Returns true for errors that indicate the proxy dropped the connection
 * rather than the scraper service returning a real failure.
 *
 * Root cause: Next.js rewrite proxy gets ECONNRESET from the scraper when
 * a long-running ingest closes the TCP socket, and returns HTTP 502 to the
 * browser.  The ingest itself IS still running (or just completed).
 */
function isProxyDrop(e: Error): boolean {
  const m = e.message;
  return (
    m.includes("502") ||          // Bad Gateway from Next.js proxy
    m.includes("504") ||          // Gateway Timeout
    m.includes("Failed to fetch") || // generic browser network error
    m.includes("NetworkError") ||
    m.includes("Load failed") ||  // Safari
    m.includes("ECONNRESET") ||   // surfaced in some runtimes
    m.includes("socket hang up")
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScraperIngestPanel() {
  // ── Form state ──
  const [query,      setQuery]      = useState("");
  const [countries,  setCountries]  = useState("");
  const [numPages,   setNumPages]   = useState("2");
  const [startPage,  setStartPage]  = useState("1");
  const [datePosted, setDatePosted] = useState<DatePostedFilter>("week");
  const [gl,         setGl]         = useState("");
  const [paramsOpen, setParamsOpen] = useState(false);

  // ── Ingest state ──
  const [ingestState, setIngestState] = useState<IngestState>({ phase: "idle" });
  const bgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear background poll timer on unmount
  useEffect(() => () => { if (bgPollRef.current) clearInterval(bgPollRef.current); }, []);

  // ── Background polling ──
  // When the proxy drops the connection but the service is busy, poll the
  // monitor every 8 s.  When busy → false, the ingest has completed.
  const startBgPoll = useCallback((provider: IngestProvider) => {
    if (bgPollRef.current) clearInterval(bgPollRef.current);
    bgPollRef.current = setInterval(async () => {
      try {
        const mon = await getMonitorStatus({ live: false });
        if (!mon.busy) {
          clearInterval(bgPollRef.current!);
          bgPollRef.current = null;
          setIngestState({
            phase: "success",
            provider,
            result: { message: "Ingest completed (connection was re-established via monitor poll)." },
          });
        }
      } catch {
        // Monitor unreachable — stop polling, leave state as-is
        clearInterval(bgPollRef.current!);
        bgPollRef.current = null;
      }
    }, 8_000);
  }, []);

  const buildParams = (): IngestParams => {
    const params: IngestParams = {};
    const q = query.trim();      if (q)  params.query    = q;
    const c = countries.trim();  if (c)  params.countries = c;
    const np = parseInt(numPages,  10);
    if (!Number.isNaN(np) && np >= 1 && np <= 20) params.num_pages = np;
    const sp = parseInt(startPage, 10);
    if (!Number.isNaN(sp) && sp >= 1) params.page = sp;
    if (datePosted !== "all") params.date_posted = datePosted;
    const g = gl.trim();         if (g)  params.gl       = g;
    return params;
  };

  const isBusy =
    ingestState.phase === "running" ||
    ingestState.phase === "checking" ||
    ingestState.phase === "running_bg";

  const runIngest = async (provider: IngestProvider) => {
    if (isBusy) return;

    // Clear any existing bg poll
    if (bgPollRef.current) { clearInterval(bgPollRef.current); bgPollRef.current = null; }

    setIngestState({ phase: "running", provider });
    const params = buildParams();

    try {
      let result: IngestResult;
      if (provider === "all")    result = await runAllProviders(params);
      else if (provider === "jsearch") result = await runJSearch(params);
      else                       result = await runSerpApi(params);
      setIngestState({ phase: "success", result, provider });

    } catch (e) {
      if (e instanceof ConflictError) {
        setIngestState({ phase: "conflict" });
        return;
      }

      // ── Proxy drop detected ──
      if (isProxyDrop(e instanceof Error ? e : new Error(String(e)))) {
        setIngestState({ phase: "checking", provider });
        try {
          // Give the service a moment to update its busy flag
          // await new Promise(r => setTimeout(r, 1_500));
          const mon = await getMonitorStatus({ live: false });
          if (mon.busy) {
            // Ingest IS running in the background
            setIngestState({ phase: "running_bg", provider });
            startBgPoll(provider);
          } else {
            // Service is idle — ingest either finished instantly or failed
            setIngestState({ phase: "dropped", provider });
          }
        } catch {
          // Can't reach monitor either
          setIngestState({ phase: "dropped", provider });
        }
        return;
      }

      setIngestState({
        phase: "error",
        message: e instanceof Error ? e.message : "Ingest failed",
        provider,
      });
    }
  };

  const dismiss = () => {
    if (bgPollRef.current) { clearInterval(bgPollRef.current); bgPollRef.current = null; }
    setIngestState({ phase: "idle" });
  };

  const inputClass =
    "w-full rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm">
      {/* ── Header ── */}
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Play className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Job Ingestion</h2>
            <p className="text-xs text-muted-foreground">
              Trigger job scraping from RapidAPI / JSearch and SerpAPI / Google Jobs
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="space-y-5 p-5">

        {/* ── Proxy note ── */}
        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden />
          <p>
            Long ingests run for several minutes. The proxy may drop the connection early — the
            service will keep running and the UI auto-detects this via the monitor.{" "}
            <a href="/logs" className="font-medium text-primary underline-offset-2 hover:underline inline-flex items-center gap-0.5">
              Check Logs &amp; Monitor
              <ExternalLink className="size-3" aria-hidden />
            </a>
            {" "}for live status.
          </p>
        </div>

        {/* ── Parameters accordion ── */}
        <div>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            onClick={() => setParamsOpen(o => !o)}
            aria-expanded={paramsOpen}
            aria-controls="ingest-params-form"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="size-3.5 text-muted-foreground" aria-hidden />
              Ingest Parameters
              <span className="text-xs font-normal text-muted-foreground">
                — optional, overrides .env defaults
              </span>
            </span>
            {paramsOpen
              ? <ChevronUp   className="size-4 text-muted-foreground" aria-hidden />
              : <ChevronDown className="size-4 text-muted-foreground" aria-hidden />}
          </button>

          {paramsOpen && (
            <div
              id="ingest-params-form"
              className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div>
                <label className={labelClass} htmlFor="ingest-query">Search query</label>
                <input id="ingest-query" type="text" value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="shopify developer remote" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="ingest-countries">
                  Countries <span className="font-normal opacity-70">(comma-separated)</span>
                </label>
                <input id="ingest-countries" type="text" value={countries}
                  onChange={e => setCountries(e.target.value)}
                  placeholder="us,ca,gb" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="ingest-date-posted">Date posted filter</label>
                <select id="ingest-date-posted" value={datePosted}
                  onChange={e => setDatePosted(e.target.value as DatePostedFilter)}
                  className={inputClass}>
                  {DATE_POSTED_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="ingest-num-pages">
                  Pages per country <span className="font-normal opacity-70">(1–20)</span>
                </label>
                <input id="ingest-num-pages" type="number" min={1} max={20}
                  value={numPages} onChange={e => setNumPages(e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="ingest-start-page">Start page</label>
                <input id="ingest-start-page" type="number" min={1}
                  value={startPage} onChange={e => setStartPage(e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="ingest-gl">
                  SerpAPI gl param <span className="font-normal opacity-70">(country code)</span>
                </label>
                <input id="ingest-gl" type="text" value={gl}
                  onChange={e => setGl(e.target.value)}
                  placeholder="us" className={inputClass} />
              </div>
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {INGEST_ACTIONS.map(({ provider, label, description, idleColor, activeColor }) => {
            const thisRunning = ingestState.phase === "running" && ingestState.provider === provider;
            return (
              <button key={provider} type="button"
                onClick={() => void runIngest(provider)}
                disabled={isBusy}
                className={cn(
                  "flex flex-col items-start rounded-xl px-4 py-3.5 text-left transition-opacity",
                  isBusy ? activeColor : idleColor,
                )}
                aria-busy={thisRunning}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {thisRunning
                    ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    : <Play    className="size-4 shrink-0" aria-hidden />}
                  {thisRunning ? "Running…" : label}
                </span>
                <span className="mt-0.5 text-[11px] opacity-80">{description}</span>
              </button>
            );
          })}
        </div>

        {/* ── Status banner ── */}
        {ingestState.phase !== "idle" && (
          <IngestStatusBanner state={ingestState} onDismiss={dismiss} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status banner
// ---------------------------------------------------------------------------

function IngestStatusBanner({
  state,
  onDismiss,
}: {
  state: Exclude<IngestState, { phase: "idle" }>;
  onDismiss: () => void;
}) {
  const pLabel = state.phase !== "conflict" ? providerLabel(state.provider) : "";

  // ── Running (waiting for direct response) ──
  if (state.phase === "running") {
    return (
      <Banner color="amber" dismissable={false}>
        <Loader2 className="size-4 shrink-0 animate-spin" />
        <div>
          <p className="font-semibold">{pLabel} ingest running…</p>
          <p className="mt-0.5 text-xs opacity-75">
            Waiting for response. This may take several minutes.
          </p>
        </div>
      </Banner>
    );
  }

  // ── Checking (proxy dropped, polling monitor) ──
  if (state.phase === "checking") {
    return (
      <Banner color="amber" dismissable={false}>
        <Loader2 className="size-4 shrink-0 animate-spin" />
        <div>
          <p className="font-semibold">Connection dropped — checking service status…</p>
          <p className="mt-0.5 text-xs opacity-75">
            Polling the monitor to determine whether the ingest is still running.
          </p>
        </div>
      </Banner>
    );
  }

  // ── Running in background (proxy dropped but busy=true confirmed) ──
  if (state.phase === "running_bg") {
    return (
      <Banner color="blue" dismissable={false}>
        <RefreshCw className="size-4 shrink-0 animate-spin" />
        <div>
          <p className="font-semibold">
            {pLabel} is running in the background
          </p>
          <p className="mt-0.5 text-xs opacity-75">
            The proxy connection dropped but the scraper service confirmed it&apos;s busy.
            Polling every 8 s — this banner updates automatically when the run completes.
          </p>
          <a href="/logs"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline">
            Watch live on Logs &amp; Monitor
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>
      </Banner>
    );
  }

  // ── Dropped (proxy dropped, service was idle — status unknown) ──
  if (state.phase === "dropped") {
    return (
      <Banner color="amber" dismissable onDismiss={onDismiss}>
        <AlertTriangle className="size-4 shrink-0" />
        <div>
          <p className="font-semibold">{pLabel} — connection interrupted</p>
          <p className="mt-0.5 text-xs opacity-75">
            The proxy dropped the connection and the service appears idle. The ingest may have
            completed very quickly, or failed silently. Check the Jobs list to verify.
          </p>
        </div>
      </Banner>
    );
  }

  // ── Success ──
  if (state.phase === "success") {
    const { result } = state;
    const details = [
      result.inserted != null && `${result.inserted} inserted`,
      result.updated  != null && `${result.updated} updated`,
      result.skipped  != null && `${result.skipped} skipped`,
    ].filter(Boolean).join(" · ");

    return (
      <Banner color="green" dismissable onDismiss={onDismiss}>
        <CheckCircle2 className="size-4 shrink-0" />
        <div>
          <p className="font-semibold">{pLabel} completed</p>
          {details
            ? <p className="mt-0.5 text-xs opacity-80">{details}</p>
            : result.message
              ? <p className="mt-0.5 text-xs opacity-80">{result.message}</p>
              : null}
        </div>
      </Banner>
    );
  }

  // ── Conflict ──
  if (state.phase === "conflict") {
    return (
      <Banner color="amber" dismissable onDismiss={onDismiss}>
        <AlertCircle className="size-4 shrink-0" />
        <div>
          <p className="font-semibold">Another ingest is already running</p>
          <p className="mt-0.5 text-xs opacity-75">
            Wait for the current run to finish, then try again.
          </p>
        </div>
      </Banner>
    );
  }

  // ── Error ──
  return (
    <Banner color="red" dismissable onDismiss={onDismiss}>
      <AlertCircle className="size-4 shrink-0" />
      <div>
        <p className="font-semibold">{pLabel} failed</p>
        <p className="mt-0.5 text-xs opacity-80">{state.message}</p>
      </div>
    </Banner>
  );
}

// ---------------------------------------------------------------------------
// Reusable banner wrapper
// ---------------------------------------------------------------------------

const BANNER_COLORS = {
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  blue:  "border-blue-500/30  bg-blue-500/10  text-blue-900  dark:text-blue-100",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  red:   "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

function Banner({
  color,
  dismissable,
  onDismiss,
  children,
}: {
  color: keyof typeof BANNER_COLORS;
  dismissable: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border p-4 text-sm", BANNER_COLORS[color])}>
      {children}
      {dismissable && onDismiss && (
        <button type="button" onClick={onDismiss}
          className="ml-auto shrink-0 rounded p-0.5 opacity-50 hover:opacity-100"
          aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
