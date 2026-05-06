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
  if (status === "Interview Scheduled") return "bg-accent/15 text-accent";
  if (status === "Applied") return "bg-primary/15 text-primary";
  if (status === "Pending") return "bg-amber-100 text-amber-700";
  return "bg-muted text-muted-foreground";
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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2>Latest Opportunities</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{filteredJobs.length} jobs shown</span>
          <div className="inline-flex rounded-lg border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <List className="size-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition",
                viewMode === "card"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <LayoutGrid className="size-3.5" />
              Card
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          viewMode === "list" ? "space-y-3" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {filteredJobs.map((job) => (
          <article
            key={job.id}
            className={cn(
              "rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-soft",
              viewMode === "card" && "h-full",
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-4",
                viewMode === "list" && "md:flex-row md:items-start md:justify-between",
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-11 overflow-hidden rounded-lg border bg-white">
                    <Image src={job.logo} alt={`${job.company} logo`} fill sizes="44px" />
                  </div>
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={cn("rounded-full px-2.5 py-1 font-medium", statusClass(job.status))}
                  >
                    {job.status}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{job.experienceLevel}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{job.jobType}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{job.location}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      <Zap className="size-3 text-primary" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  "flex min-w-44 gap-2",
                  viewMode === "list"
                    ? "flex-row items-end justify-between md:flex-col"
                    : "mt-auto flex-col items-start",
                )}
              >
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  {job.datePosted}
                </div>
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {job.location}
                </div>
                <div className="flex gap-2">
                  <button className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted">
                    <Bookmark className="size-3.5" />
                    {job.saved ? "Saved" : "Save"}
                  </button>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Apply
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}

        {filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            No jobs match your current filters. Adjust search criteria to discover more roles.
          </div>
        ) : null}
      </div>
    </section>
  );
}
