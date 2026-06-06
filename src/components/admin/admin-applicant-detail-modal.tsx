"use client";

import { ExternalLink, Mail } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/format-date";
import { applicantBadgeClass, formatApplicantStatus } from "@/lib/applicant-status";
import { cn } from "@/lib/utils";
import { ApplicantAvatar } from "@/components/admin/applicant-avatar";
import { AdminApplicantFilesSection } from "@/components/admin/admin-applicant-files-section";
import type { AdminJobApplicant, AdminJobDetail } from "@/types/admin-job-api";

type AdminApplicantDetailModalProps = {
  applicant: AdminJobApplicant;
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

export function AdminApplicantDetailModal({
  applicant,
  job,
  onClose,
}: AdminApplicantDetailModalProps) {
  const name = applicant.full_name || applicant.email || "Applicant";

  return (
    <Modal
      aria-label="Application detail"
      title="Application Detail"
      description={`${job.job_title} · ${job.company}`}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {/* Identity header */}
      <div className="flex items-center gap-3">
        <ApplicantAvatar
          userId={applicant.user_id}
          name={name}
          profilePictureUrl={applicant.profile_picture_url}
          sizeClass="size-12"
          textClass="text-base"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{name}</p>
          {applicant.email ? (
            <a
              href={`mailto:${applicant.email}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Mail className="size-3.5" aria-hidden />
              {applicant.email}
            </a>
          ) : null}
        </div>
        <span
          className={cn(
            "ml-auto inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            applicantBadgeClass(applicant.status),
          )}
        >
          {formatApplicantStatus(applicant.status)}
        </span>
      </div>

      {/* Detail grid */}
      <dl className="mt-5 grid grid-cols-2 gap-4">
        <Field label="Application ID">
          <span className="tabular-nums">#{applicant.application_id}</span>
        </Field>
        <Field label="User ID">
          <span className="tabular-nums">#{applicant.user_id}</span>
        </Field>
        <Field label="Applied">
          {formatDateTime(applicant.applied_at ?? applicant.created_at)}
        </Field>
        <Field label="Record created">{formatDateTime(applicant.created_at)}</Field>
      </dl>

      {/* Notes */}
      <div className="mt-5 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
        {applicant.notes.trim() ? (
          <p className="whitespace-pre-wrap rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm text-foreground">
            {applicant.notes}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No notes recorded.</p>
        )}
      </div>

      {/* Attachments — preview / delete */}
      <div className="mt-5">
        <AdminApplicantFilesSection applicationId={applicant.application_id} />
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <a
          href={job.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          View job
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
