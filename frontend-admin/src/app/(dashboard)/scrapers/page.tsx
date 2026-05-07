import { RefreshCw } from "lucide-react";

export default function AdminScrapersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Scrapers
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Configure schedules, sources, and health checks for ingestion pipelines.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        <RefreshCw className="mx-auto mb-3 size-10 text-primary/60" aria-hidden />
        Scraper configuration and run history will appear here.
      </div>
    </div>
  );
}
