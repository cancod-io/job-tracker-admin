"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
} from "lucide-react";
import { mockApplications } from "@/data/mock-applications";
import { applicationStatusBadgeClass } from "@/lib/application-status-badge";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/job";

const statusIcon: Record<ApplicationStatus, ReactNode> = {
  "Not Applied": null,
  Applied: <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />,
  Pending: <Clock3 className="size-3.5 shrink-0" aria-hidden />,
  "Interview Scheduled": <GraduationCap className="size-3.5 shrink-0" aria-hidden />,
};

const summarySegments: Array<{
  status: Exclude<ApplicationStatus, "Not Applied">;
  label: string;
  iconClass: string;
}> = [
  { status: "Applied", label: "Applied", iconClass: "text-primary" },
  { status: "Interview Scheduled", label: "Interview", iconClass: "text-accent" },
  { status: "Pending", label: "Pending", iconClass: "text-amber-600 dark:text-amber-400" },
];

export function ApplicationsPanel() {
  const [open, setOpen] = useState(true);

  const counts = useMemo(() => {
    return mockApplications.reduce<Partial<Record<ApplicationStatus, number>>>((acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  return (
    <section
      id="applications"
      className="scroll-mt-24 rounded-3xl border border-border/70 bg-card shadow-sm md:scroll-mt-28"
      aria-labelledby="applications-heading"
    >
      <div className="relative overflow-hidden border-b border-border/60 px-4 py-4 md:px-6 md:py-5">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.03]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Briefcase className="size-3.5 text-primary" aria-hidden />
              Pipeline
            </p>
            <h2
              id="applications-heading"
              className="mt-2 text-base font-semibold tracking-tight text-foreground md:text-lg"
            >
              My applications
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground md:text-sm">
              Keep interviews and follow-ups visible while you filter jobs above. Your full timeline
              lives on the Applications page.
            </p>
          </div>
          <button
            type="button"
            id="applications-panel-toggle"
            aria-expanded={open}
            aria-controls="applications-panel-body"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span className="sm:hidden">{open ? "Hide" : "Show"}</span>
            <span className="hidden sm:inline">{open ? "Hide list" : "Show list"}</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </div>

        <div
          className="relative mt-4 flex flex-wrap gap-2"
          aria-label="Counts by application status"
        >
          {summarySegments.map(({ status, label, iconClass }) => {
            const n = counts[status] ?? 0;
            if (n === 0) return null;
            const Icon =
              status === "Applied" ? CheckCircle2 : status === "Pending" ? Clock3 : GraduationCap;
            return (
              <span
                key={status}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm"
              >
                <Icon className={cn("size-3.5 shrink-0", iconClass)} aria-hidden />
                <span className="tabular-nums">{n}</span>
                <span className="text-muted-foreground">{label}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div
        id="applications-panel-body"
        role="region"
        aria-labelledby="applications-heading"
        hidden={!open}
      >
        <div className="px-4 py-4 md:px-6 md:pb-6 md:pt-5">
          <ul className="space-y-2">
            {mockApplications.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-border/70 bg-gradient-to-b from-background to-muted/25 p-4 transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-sm motion-reduce:transition-none"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.company}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      applicationStatusBadgeClass(item.status),
                    )}
                  >
                    {statusIcon[item.status]}
                    {item.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              Applied from a listing? After backend sync, new roles will show up here automatically.
            </p>
            <Link
              href="/applications"
              className="hover:bg-primary/92 inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Open Applications
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
