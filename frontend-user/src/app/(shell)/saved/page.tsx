import Link from "next/link";
import { Bookmark } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default function SavedJobsPage() {
  return (
    <>
      <PageHeader
        title="Saved jobs"
        description="Jobs you bookmark from the dashboard will be listed here for quick revisit and batch applying."
        breadcrumbs={[{ label: "Jobs", href: "/" }, { label: "Saved jobs" }]}
        actions={
          <Link
            href="/#jobs"
            className="hover:bg-primary/92 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors"
          >
            Back to feed
          </Link>
        }
      />
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-10 text-center">
        <Bookmark className="mx-auto mb-3 size-10 text-primary/60" aria-hidden />
        <p className="text-sm text-muted-foreground">
          No saved jobs yet. Use Save on a listing in the dashboard to build your shortlist.
        </p>
      </div>
    </>
  );
}
