"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useJobFiltersStore } from "@/store/job-filters";
import type { ExperienceLevel, JobType } from "@/types/job";

const experienceOptions: Array<ExperienceLevel | "All"> = ["All", "Junior", "Mid-Level", "Senior"];
const jobTypeOptions: Array<JobType | "All"> = ["All", "Remote", "Full-Time", "Contract"];

export function FilterToolbar() {
  const { query, experience, jobType, setQuery, setExperience, setJobType, reset } =
    useJobFiltersStore();

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative grow">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Shopify, Liquid, React..."
            className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none ring-primary transition focus:ring-2"
          />
        </label>

        <select
          value={experience}
          onChange={(event) => setExperience(event.target.value as ExperienceLevel | "All")}
          className="h-11 rounded-xl border bg-background px-3 text-sm outline-none ring-primary transition focus:ring-2"
        >
          {experienceOptions.map((option) => (
            <option key={option} value={option}>
              Experience: {option}
            </option>
          ))}
        </select>

        <select
          value={jobType}
          onChange={(event) => setJobType(event.target.value as JobType | "All")}
          className="h-11 rounded-xl border bg-background px-3 text-sm outline-none ring-primary transition focus:ring-2"
        >
          {jobTypeOptions.map((option) => (
            <option key={option} value={option}>
              Job Type: {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <X className="size-4" />
          Reset
        </button>
      </div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs">
        <SlidersHorizontal className="size-3.5 text-accent" />
        Core filters optimized for fast scanning and minimal clicks.
      </div>
    </section>
  );
}
