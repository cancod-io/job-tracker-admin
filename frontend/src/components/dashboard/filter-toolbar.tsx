"use client";

import { useId } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useJobFiltersStore } from "@/store/job-filters";
import type { ExperienceLevel, JobType } from "@/types/job";

const experienceOptions: Array<ExperienceLevel | "All"> = ["All", "Junior", "Mid-Level", "Senior"];
const jobTypeOptions: Array<JobType | "All"> = ["All", "Remote", "Full-Time", "Contract"];

export function FilterToolbar() {
  const searchId = useId();
  const experienceId = useId();
  const jobTypeId = useId();
  const { query, experience, jobType, setQuery, setExperience, setJobType, reset } =
    useJobFiltersStore();

  return (
    <section
      className="rounded-2xl border bg-card p-4 shadow-sm md:p-6"
      aria-labelledby="filters-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="filters-heading" className="text-base font-semibold text-foreground md:text-lg">
          Filters
        </h2>
        <p className="text-xs text-muted-foreground">
          Refine listings by keyword, seniority, and role type.
        </p>
      </div>

      <div
        role="search"
        aria-label="Search and filter jobs"
        className="grid gap-4 lg:grid-cols-12 lg:items-end"
      >
        <div className="relative lg:col-span-5">
          <label htmlFor={searchId} className="mb-1.5 block text-xs font-medium text-foreground">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Shopify, Liquid, React…"
              autoComplete="off"
              className="form-control h-11 w-full pl-10 lg:min-w-0"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5">
          <div>
            <label
              htmlFor={experienceId}
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Experience level
            </label>
            <select
              id={experienceId}
              value={experience}
              onChange={(event) => setExperience(event.target.value as ExperienceLevel | "All")}
              className="form-control h-11 w-full cursor-pointer sm:min-w-[11rem]"
              aria-label="Filter by experience level"
            >
              {experienceOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All levels" : option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={jobTypeId} className="mb-1.5 block text-xs font-medium text-foreground">
              Job type
            </label>
            <select
              id={jobTypeId}
              value={jobType}
              onChange={(event) => setJobType(event.target.value as JobType | "All")}
              className="form-control h-11 w-full cursor-pointer sm:min-w-[11rem]"
              aria-label="Filter by job type"
            >
              {jobTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All types" : option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end lg:col-span-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-secondary-foreground shadow-sm transition-colors duration-200 hover:bg-muted hover:text-foreground motion-reduce:transition-none lg:w-auto"
            aria-label="Clear all filters"
          >
            <X className="size-4 shrink-0" aria-hidden />
            Reset
          </button>
        </div>
      </div>

      <p className="mt-4 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground">
        <SlidersHorizontal className="size-3.5 shrink-0 text-primary" aria-hidden />
        <span>Tip: combine keyword search with experience filters for faster shortlists.</span>
      </p>
    </section>
  );
}
