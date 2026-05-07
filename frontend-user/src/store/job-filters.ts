"use client";

import { create } from "zustand";
import type { ExperienceLevel, JobType } from "@/types/job";

type JobFiltersState = {
  query: string;
  experience: ExperienceLevel | "All";
  jobType: JobType | "All";
  setQuery: (value: string) => void;
  setExperience: (value: ExperienceLevel | "All") => void;
  setJobType: (value: JobType | "All") => void;
  reset: () => void;
};

const defaultState = {
  query: "",
  experience: "All" as const,
  jobType: "All" as const,
};

export const useJobFiltersStore = create<JobFiltersState>((set) => ({
  ...defaultState,
  setQuery: (query) => set({ query }),
  setExperience: (experience) => set({ experience }),
  setJobType: (jobType) => set({ jobType }),
  reset: () => set(defaultState),
}));
