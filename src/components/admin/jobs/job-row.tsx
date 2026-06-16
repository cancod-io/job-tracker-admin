"use client";

import { ChevronDown, Eye, Trash2 } from "lucide-react";
import { ApplicantAvatar } from "@/components/admin/applicant-avatar";
import { ApplicantsPanel, type ApplicantsState } from "@/components/admin/jobs/applicants-panel";
import {
  avatarTint,
  formatApplicantStatus,
  initials,
} from "@/lib/applicant-status";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { AdminJobApplicant, AdminJobDetail } from "@/types/admin-job-api";

const PREVIEW_AVATARS = 4;

type JobRowProps = {
  job: AdminJobDetail;
  expanded: boolean;
  applicants: ApplicantsState | undefined;
  canDelete: boolean;
  canViewApplications: boolean;
  onToggle: () => void;
  onRetryApplicants: () => void;
  onViewDetail: () => void;
  onRemove: () => void;
  onSelectApplicant: (applicant: AdminJobApplicant) => void;
};

export function JobRow({
  job,
  expanded,
  applicants,
  canDelete,
  canViewApplications,
  onToggle,
  onRetryApplicants,
  onViewDetail,
  onRemove,
  onSelectApplicant,
}: JobRowProps) {
  const hasApplicants =
    canViewApplications && (job.applicants_total > 0 || job.applicants_preview.length > 0);

  return (
    <>
      <tr
        className={cn(
          "border-b border-border/60 align-top last:border-0",
          hasApplicants && "cursor-pointer transition-colors hover:bg-muted/30",
          expanded && "bg-muted/30",
        )}
        onClick={hasApplicants ? onToggle : undefined}
      >
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label={expanded ? "Collapse applicants" : "Expand applicants"}
              aria-expanded={expanded}
              disabled={!hasApplicants}
            >
              <ChevronDown
                className={cn("size-4 transition-transform", expanded && "rotate-180")}
                aria-hidden
              />
            </button>
            <div className="min-w-0">
              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block max-w-[17rem] truncate font-semibold text-primary hover:underline"
                title={job.job_title}
              >
                {job.job_title}
              </a>
            </div>
          </div>
        </td>

        <td className="px-4 py-4 align-middle">
          <div className="flex items-center gap-2">
            <CompanyLogo name={job.company} logoUrl={job.company_logo_url} />
            <span className="font-medium text-foreground">{job.company}</span>
          </div>
        </td>

        <td className="px-4 py-4 align-middle">
          {hasApplicants ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-muted"
              aria-label="View applicants"
            >
              <AvatarStack applicants={job.applicants_preview} total={job.applicants_total} />
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">No applicants</span>
          )}
        </td>

        <td className="whitespace-nowrap px-4 py-4 align-middle tabular-nums text-muted-foreground">
          {formatDateTime(job.created_at)}
        </td>

        <td className="px-4 py-4 text-right align-middle">
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Eye className="size-3.5" aria-hidden />
              Details
            </button>
            {canDelete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Remove
              </button>
            ) : null}
          </div>
        </td>
      </tr>

      {expanded && canViewApplications ? (
        <tr className="border-b border-border/60 bg-muted/20">
          <td colSpan={5} className="px-4 py-4">
            <div className="border-l-2 border-primary/20 pl-4">
              <ApplicantsPanel
                state={applicants}
                previewFallback={job.applicants_preview}
                onRetry={onRetryApplicants}
                onSelect={onSelectApplicant}
              />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function CompanyLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className="size-7 shrink-0 rounded-md object-contain"
        loading="lazy"
      />
    );
  }
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
        avatarTint(name),
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function AvatarStack({
  applicants,
  total,
}: {
  applicants: AdminJobApplicant[];
  total: number;
}) {
  const shown = applicants.slice(0, PREVIEW_AVATARS);
  const extra = Math.max(0, total - shown.length);
  return (
    <span className="flex items-center">
      <span className="flex -space-x-2">
        {shown.map((applicant) => (
          <ApplicantAvatar
            key={applicant.application_id}
            userId={applicant.user_id}
            name={applicant.full_name || applicant.email}
            profilePictureUrl={applicant.profile_picture_url}
            ring
            title={`${applicant.full_name} · ${formatApplicantStatus(applicant.status)}`}
          />
        ))}
      </span>
      {extra > 0 ? (
        <span className="ml-2 text-xs font-medium text-primary">+{extra} more</span>
      ) : null}
    </span>
  );
}
