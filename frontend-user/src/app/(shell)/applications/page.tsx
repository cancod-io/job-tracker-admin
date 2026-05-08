"use client";

import Link from "next/link";
import { useState } from "react";
import { Briefcase, ChevronDown } from "lucide-react";
import { mockApplications } from "@/data/mock-applications";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export default function ApplicationsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="My applications"
        description="Track statuses from applied to interview. Data will sync with the API in a follow-up milestone."
        breadcrumbs={[{ label: "Jobs", href: "/" }, { label: "Applications" }]}
        actions={
          <Link
            href="/#jobs"
            className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
          >
            Browse jobs
          </Link>
        }
      />
      <div className="space-y-3">
        {mockApplications.map((app, index) => {
          const open = expandedId === app.title;
          const panelId = `application-panel-${index}`;
          const buttonId = `application-toggle-${index}`;

          return (
            <article
              key={app.title}
              className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
            >
              <button
                type="button"
                id={buttonId}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                onClick={() => setExpandedId(open ? null : app.title)}
                aria-expanded={open}
                aria-controls={panelId}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">{app.title}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{app.company}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground sm:hidden">
                      {app.status}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                    {app.status}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                      open && "rotate-180",
                    )}
                    aria-hidden
                  />
                </div>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!open}
                className="border-t border-border/60 bg-muted/15 px-5 py-4"
              >
                <p className="text-sm text-muted-foreground">
                  Application timeline and status updates will appear here once connected to your
                  backend.
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
