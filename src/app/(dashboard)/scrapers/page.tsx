import { Terminal } from "lucide-react";
import { ScraperIngestPanel } from "@/components/admin/scraper-ingest-panel";
import { ScraperHelpPanel } from "@/components/admin/scraper-help-panel";
import { ScraperShutdownPanel } from "@/components/admin/scraper-shutdown-panel";

export default function AdminScrapersPage() {
  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <header className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Terminal className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Administrator Controls
            </h1>
            <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
              Trigger job ingestion pipelines, browse the API reference, and manage server
              lifecycle. For live service health and quota, see{" "}
              <a href="/logs" className="font-medium text-primary underline-offset-2 hover:underline">
                Logs &amp; Monitor
              </a>
              .
            </p>
          </div>
        </div>
      </header>

      {/* ── Job Ingestion ── */}
      <section aria-label="Job ingestion">
        <ScraperIngestPanel />
      </section>

      {/* ── API Routes Reference ── */}
      <section aria-label="API routes reference">
        <ScraperHelpPanel />
      </section>

      {/* ── System Controls / Shutdown ── */}
      <section aria-label="System controls">
        <ScraperShutdownPanel />
      </section>
    </div>
  );
}
