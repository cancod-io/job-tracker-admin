"use client";

import { Eye, Loader2 } from "lucide-react";
import { ApplicantAvatar } from "@/components/admin/applicant-avatar";
import {
  applicantBadgeClass,
  formatApplicantStatus,
} from "@/lib/applicant-status";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { AdminJobApplicant } from "@/types/admin-job-api";

export type ApplicantsState = {
  loading: boolean;
  error: string | null;
  items: AdminJobApplicant[];
};

type ApplicantsPanelProps = {
  state: ApplicantsState | undefined;
  previewFallback: AdminJobApplicant[];
  onRetry: () => void;
  onSelect: (applicant: AdminJobApplicant) => void;
};

export function ApplicantsPanel({
  state,
  previewFallback,
  onRetry,
  onSelect,
}: ApplicantsPanelProps) {
  const loading = state?.loading ?? false;
  const error = state?.error ?? null;
  const rows = state && state.items.length > 0 ? state.items : previewFallback;

  return (
    <div className="rounded-xl border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Applicants for this job
        </h4>
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            Retry
          </button>
        </div>
      ) : loading && rows.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading applicants…
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No applicants for this job yet.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {rows.map((applicant) => (
            <li key={applicant.application_id}>
              <button
                type="button"
                onClick={() => onSelect(applicant)}
                className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left transition-colors hover:bg-muted/40 sm:gap-x-6"
              >
                <div className="flex min-w-[10rem] flex-1 items-center gap-2">
                  <ApplicantAvatar
                    userId={applicant.user_id}
                    name={applicant.full_name || applicant.email}
                    profilePictureUrl={applicant.profile_picture_url}
                  />
                  <span className="font-medium text-foreground">{applicant.full_name}</span>
                </div>
                <span className="min-w-[12rem] flex-1 text-sm text-muted-foreground">
                  {applicant.email}
                </span>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    applicantBadgeClass(applicant.status),
                  )}
                >
                  {formatApplicantStatus(applicant.status)}
                </span>
                <span className="shrink-0 whitespace-nowrap tabular-nums text-sm text-muted-foreground">
                  {formatDateTime(applicant.applied_at ?? applicant.created_at)}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground">
                  <Eye className="size-3.5" aria-hidden />
                  View
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
