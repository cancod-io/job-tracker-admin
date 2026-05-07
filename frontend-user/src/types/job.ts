export type ExperienceLevel = "Junior" | "Mid-Level" | "Senior";
export type JobType = "Remote" | "Full-Time" | "Contract";
export type ApplicationStatus = "Not Applied" | "Applied" | "Pending" | "Interview Scheduled";

export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string;
  datePosted: string;
  location: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  jobType: JobType;
  url: string;
  status: ApplicationStatus;
  saved: boolean;
};
