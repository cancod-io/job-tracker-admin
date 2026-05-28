import { FileText } from "lucide-react";
import { ScraperLogsMonitor } from "@/components/admin/scraper-logs-monitor";

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Logs &amp; Monitor
            </h1>
            <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
              Live scraper service status, API quota details, and a running history of
              every health check. Auto-polls every 30 seconds.
            </p>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <ScraperLogsMonitor />
    </div>
  );
}
