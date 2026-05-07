"use client";

import { useState } from "react";
import Image from "next/image";
import { Bookmark, CalendarClock, ExternalLink, LayoutGrid, List, MapPin, Zap } from "lucide-react";
import { mockJobs } from "@/data/mock-jobs";
import { cn } from "@/lib/utils";
import { useJobFiltersStore } from "@/store/job-filters";
import type { ApplicationStatus, Job } from "@/types/job";

type ViewMode = "list" | "card";

function statusClass(status: ApplicationStatus): string {
  if (status === "Interview Scheduled") {
    return "bg-accent/20 text-accent-foreground ring-1 ring-accent/35";
  }
  if (status === "Applied") return "bg-primary/12 text-primary ring-1 ring-primary/20";
  if (status === "Pending") return "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80";
  return "bg-muted text-muted-foreground ring-1 ring-border";
}

function matchesFilters(job: Job, query: string, experience: string, jobType: string): boolean {
  const normalizedQuery = query.toLowerCase();
  const matchesText =
    normalizedQuery.length === 0 ||
    job.title.toLowerCase().includes(normalizedQuery) ||
    job.company.toLowerCase().includes(normalizedQuery) ||
    job.skills.some((skill) => skill.toLowerCase().includes(normalizedQuery));
  const matchesExperience = experience === "All" || job.experienceLevel === experience;
  const matchesType = jobType === "All" || job.jobType === jobType;
  return matchesText && matchesExperience && matchesType;
}

export function JobsList() {
  const { query, experience, jobType } = useJobFiltersStore();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const filteredJobs = mockJobs.filter((job) => matchesFilters(job, query, experience, jobType));

  return (
    <section
      id="jobs"
      className="scroll-mt-24 space-y-5 md:scroll-mt-28"
      aria-labelledby="jobs-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="jobs-heading">Latest opportunities</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} shown
          </span>
          <div
            className="inline-flex rounded-lg border border-input bg-muted/40 p-1 shadow-sm"
            role="group"
            aria-label="Job list layout"
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-200 motion-reduce:transition-none",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
            >
              <List className="size-3.5 shrink-0" aria-hidden />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              aria-pressed={viewMode === "card"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-200 motion-reduce:transition-none",
                viewMode === "card"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-3.5 shrink-0" aria-hidden />
              Cards
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          viewMode === "list" ? "space-y-3" : "grid gap-4 sm:grid-cols-3 xl:grid-cols-4",
        )}
      >
        {filteredJobs.map((job) => (
          <article
            key={job.id}
            className={cn(
              "rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 motion-reduce:transition-none",
              "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft motion-reduce:hover:translate-y-0",
              viewMode === "card" && "flex h-full flex-col",
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-5",
                viewMode === "list" && "md:flex-row md:items-start md:justify-between md:gap-6",
              )}
            >
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-white p-1">
                    <Image
                      src={job.logo}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 48px, 48px"
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base leading-snug text-foreground md:text-lg">
                      {job.title}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                      {job.company}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 font-medium",
                      statusClass(job.status),
                    )}
                  >
                    {job.status}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 font-medium text-secondary-foreground">
                    {job.experienceLevel}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 font-medium text-secondary-foreground">
                    {job.jobType}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 font-medium text-secondary-foreground">
                    {job.location}
                  </span>
                </div>

                <ul className="flex flex-wrap gap-2" aria-label="Key skills">
                  {job.skills.map((skill) => (
                    <li key={skill}>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs text-secondary-foreground">
                        <Zap className="size-3 shrink-0 text-primary" aria-hidden />
                        {skill}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={cn(
                  "flex shrink-0 flex-col gap-3 border-t border-border/60 pt-4 sm:min-w-[11rem] md:border-t-0 md:pt-0",
                  viewMode === "list"
                    ? "md:items-end md:border-l md:border-border/60 md:pl-6 md:pt-0"
                    : "mt-auto border-t",
                )}
              >
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                    Posted {job.datePosted}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {job.location}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex h-10 min-h-10 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 text-xs font-semibold text-secondary-foreground shadow-sm transition-colors duration-200 hover:bg-muted hover:text-foreground motion-reduce:transition-none"
                    aria-pressed={job.saved}
                    aria-label={
                      job.saved
                        ? `Remove ${job.title} at ${job.company} from saved jobs`
                        : `Save ${job.title} at ${job.company} for later`
                    }
                  >
                    <Bookmark className="size-3.5 shrink-0" aria-hidden />
                    {job.saved ? "Saved" : "Save"}
                  </button>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:bg-primary/92 inline-flex h-10 min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-[transform,background-color,box-shadow] duration-200 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                    aria-label={`Apply to ${job.title} at ${job.company} (opens in a new tab)`}
                  >
                    Apply
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}

        {filteredJobs.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            No jobs match your current filters. Adjust search criteria to discover more roles.
          </div>
        ) : null}
      </div>
    </section>
  );
}
