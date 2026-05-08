import { Briefcase } from "lucide-react";

export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Jobs</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Moderate scraped listings: edit fields, flag duplicates, and remove stale posts.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        <Briefcase className="mx-auto mb-3 size-10 text-primary/60" aria-hidden />
        Job management table and actions will connect to the API here.
      </div>
    </div>
  );
}
