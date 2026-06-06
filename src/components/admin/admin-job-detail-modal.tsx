"use client";

import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { AdminJobDetail } from "@/types/admin-job-api";

type AdminJobDetailModalProps = {
  job: AdminJobDetail;
  onClose: () => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function AdminJobDetailModal({ job, onClose }: AdminJobDetailModalProps) {
  return (
    <Modal
      aria-label="Job detail"
      title={job.job_title}
      description={`${job.company}${job.location ? ` · ${job.location}` : ""}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="flex items-start gap-3">
        {job.company_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.company_logo_url}
            alt=""
            className="size-12 shrink-0 rounded-lg border border-border object-contain"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{job.company}</p>
          <p className="text-xs text-muted-foreground">
            Job #{job.id}
            {job.source ? ` · Source: ${job.source}` : null}
          </p>
        </div>
        {job.is_new ? (
          <span className="shrink-0 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-800 dark:text-sky-200">
            New
          </span>
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Location">{job.location ?? "—"}</Field>
        <Field label="Job type">{job.job_type ?? "—"}</Field>
        <Field label="Salary">{job.salary ?? "—"}</Field>
        <Field label="Applicants">
          <span className="tabular-nums">{job.applicants_total}</span>
        </Field>
        <Field label="Created">{formatDateTime(job.created_at)}</Field>
        <Field label="Updated">{formatDateTime(job.updated_at)}</Field>
        {job.scraped_at ? (
          <Field label="Scraped">{formatDateTime(job.scraped_at)}</Field>
        ) : null}
        {job.job_id ? <Field label="External ID">{job.job_id}</Field> : null}
      </dl>

      {job.skills.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-xs text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Description
        </p>
        {job.description.trim() ? (
          <div
            className={cn(
              "max-h-72 overflow-y-auto rounded-lg border border-border/70 bg-muted/20 px-3 py-2",
              "text-sm leading-relaxed text-foreground whitespace-pre-wrap",
            )}
          >
            {job.description}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No description available.</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <a
          href={job.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Open apply URL
          <ExternalLink className="size-3.5 opacity-70" aria-hidden />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
