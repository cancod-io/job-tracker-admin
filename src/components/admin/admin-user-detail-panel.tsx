"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Copy,
  Download,
  Eye,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import { SidePanel } from "@/components/ui/side-panel";
import { ApplicantAvatar } from "@/components/admin/applicant-avatar";
import { AdminUserCvPreviewModal } from "@/components/admin/admin-user-cv-preview-modal";
import {
  deleteAdminUser,
  downloadUserCv,
  getAdminUser,
  patchUserApproval,
  resetUserPassword,
} from "@/lib/admin-user-api";
import { canPreviewFilename, formatFileSize } from "@/lib/admin-file-utils";
import { formatDateTime } from "@/lib/format-date";
import { applicantBadgeClass, formatApplicantStatus } from "@/lib/applicant-status";
import {
  approvalBadgeClass,
  approvalLabel,
  canDeleteUser,
  canManageUserApproval,
  formatApprovedBy,
} from "@/lib/user-approval";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { AdminUserCv, AdminUserDetail } from "@/types/admin-user-api";
import type { UserApprovalStatus } from "@/types/auth";

type AdminUserDetailPanelProps = {
  userId: number | null;
  onClose: () => void;
  onUpdated: () => void;
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border/60 px-5 py-4 last:border-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-1.5 text-sm sm:grid-cols-[8.5rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

function formatLocation(detail: AdminUserDetail): string {
  const parts = [detail.city, detail.country, detail.zip_code].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function AdminUserDetailPanel({ userId, onClose, onUpdated }: AdminUserDetailPanelProps) {
  const { accessToken, user: currentUser } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingCvId, setDownloadingCvId] = useState<number | null>(null);
  const [previewCv, setPreviewCv] = useState<AdminUserCv | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || userId == null) return;
    setLoading(true);
    setError(null);
    try {
      const body = await getAdminUser(accessToken, userId);
      setDetail(body);
    } catch (e) {
      setDetail(null);
      setError(e instanceof Error ? e.message : "Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId]);

  useEffect(() => {
    if (userId == null) {
      setDetail(null);
      setError(null);
      return;
    }
    void load();
  }, [userId, load]);

  const isSelf = currentUser != null && userId != null && currentUser.id === userId;
  const canApproveReject = canManageUserApproval(currentUser?.role);
  const canRemoveUser = canDeleteUser(currentUser?.role);

  const runAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setError(null);
    try {
      await fn();
      await load();
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproval = (status: Exclude<UserApprovalStatus, "pending">) => {
    if (!accessToken || userId == null) return;
    if (status === "rejected" && isSelf) {
      setError("You cannot reject your own account.");
      return;
    }
    void runAction(() => patchUserApproval(accessToken, userId, status));
  };

  const handleResetPassword = () => {
    if (!accessToken || userId == null || !detail) return;
    if (
      !window.confirm(
        `Reset the login password for ${detail.email} to the configured default? The user will need to sign in with that password.`,
      )
    ) {
      return;
    }
    void runAction(() => resetUserPassword(accessToken, userId));
  };

  const handleDeleteUser = () => {
    if (!accessToken || userId == null || !detail) return;
    if (isSelf) {
      setError("You cannot delete your own account.");
      return;
    }
    if (
      !window.confirm(
        `Permanently remove ${detail.full_name || detail.email} from the platform? This cannot be undone.`,
      )
    ) {
      return;
    }
    void (async () => {
      setActionLoading(true);
      setError(null);
      try {
        await deleteAdminUser(accessToken, userId);
        onUpdated();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove user.");
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const handleDownloadCv = async (cvId: number, filename: string) => {
    if (!accessToken || userId == null) return;
    setDownloadingCvId(cvId);
    setError(null);
    try {
      await downloadUserCv(accessToken, userId, cvId, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CV download failed.");
    } finally {
      setDownloadingCvId(null);
    }
  };

  const copyEmail = async () => {
    if (!detail?.email) return;
    try {
      await navigator.clipboard.writeText(detail.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy email to clipboard.");
    }
  };

  return (
    <SidePanel
      open={userId != null}
      aria-label="User details"
      title="User Details"
      onClose={onClose}
      widthClass="w-full max-w-md sm:max-w-[31rem]"
    >
      {loading && !detail ? (
        <div className="flex items-center justify-center gap-2 px-5 py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Loading profile…
        </div>
      ) : error && !detail ? (
        <div className="space-y-4 px-5 py-8">
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Retry
          </button>
        </div>
      ) : detail ? (
        <>
          {/* Profile header */}
          <div className="border-b border-border/60 px-5 py-5">
            <div className="flex items-start gap-4">
              <ApplicantAvatar
                userId={detail.id}
                name={detail.full_name || detail.email}
                profilePictureUrl={detail.profile_picture_url}
                hasAvatar={detail.has_avatar}
                attemptFetch
                sizeClass="size-16"
                textClass="text-lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-lg font-semibold text-foreground">{detail.full_name}</p>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      approvalBadgeClass(detail.approval_status),
                    )}
                  >
                    {approvalLabel(detail.approval_status)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{detail.email}</span>
                  <button
                    type="button"
                    onClick={() => void copyEmail()}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Copy email"
                    title={copied ? "Copied" : "Copy email"}
                  >
                    <Copy className="size-3.5" aria-hidden />
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  User ID: <span className="tabular-nums text-foreground">USR-{detail.id}</span>
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  Role: <span className="text-foreground">{detail.role}</span>
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <p
              className="mx-5 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Section icon={UserRound} title="Account Information">
            <dl>
              <DetailRow label="Full Name">{detail.full_name || "—"}</DetailRow>
              <DetailRow label="Email">{detail.email || "—"}</DetailRow>
              <DetailRow label="Phone">{detail.phone || "—"}</DetailRow>
              <DetailRow label="Registered On">{formatDateTime(detail.created_at)}</DetailRow>
              <DetailRow label="Last Login">
                {detail.last_login_at ? formatDateTime(detail.last_login_at) : "—"}
              </DetailRow>
              <DetailRow label="Active">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    detail.is_active
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      : "border-destructive/25 bg-destructive/10 text-destructive",
                  )}
                >
                  {detail.is_active ? "Yes" : "No"}
                </span>
              </DetailRow>
            </dl>
          </Section>

          <Section icon={Shield} title="Status & Permissions">
            <dl>
              <DetailRow label="Approval Status">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    approvalBadgeClass(detail.approval_status),
                  )}
                >
                  {approvalLabel(detail.approval_status)}
                </span>
              </DetailRow>
              <DetailRow label="Approved On">
                {detail.approved_at ? formatDateTime(detail.approved_at) : "—"}
              </DetailRow>
              <DetailRow label="Approved By">{formatApprovedBy(detail)}</DetailRow>
              <DetailRow label="Role">
                <span className="capitalize">{detail.role}</span>
              </DetailRow>
              <DetailRow label="2FA">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    detail.two_factor_enabled
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {detail.two_factor_enabled ? "Enabled" : "Disabled"}
                </span>
              </DetailRow>
              <DetailRow label="Permissions">
                {detail.permissions.length > 0 ? (
                  <ul className="list-inside list-disc space-y-0.5">
                    {detail.permissions.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </DetailRow>
            </dl>
          </Section>

          <Section icon={Briefcase} title="Profile Information">
            <dl>
              <DetailRow label="Country">{detail.country || "—"}</DetailRow>
              <DetailRow label="City">{detail.city || "—"}</DetailRow>
              <DetailRow label="Zip Code">{detail.zip_code || "—"}</DetailRow>
              <DetailRow label="Location">{formatLocation(detail)}</DetailRow>
              <DetailRow label="Website">
                {detail.website ? (
                  <a
                    href={detail.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {detail.website}
                    <ExternalLink className="size-3 opacity-70" aria-hidden />
                  </a>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Bio">
                {detail.bio ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{detail.bio}</p>
                ) : (
                  "—"
                )}
              </DetailRow>
            </dl>
          </Section>

          {detail.job_applications.length > 0 ? (
            <Section icon={Briefcase} title="Job Applications">
              <ul className="space-y-2">
                {detail.job_applications.map((app) => (
                  <li
                    key={app.application_id}
                    className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{app.job_title}</p>
                        <p className="truncate text-xs text-muted-foreground">{app.company}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          applicantBadgeClass(app.status),
                        )}
                      >
                        {formatApplicantStatus(app.status)}
                      </span>
                    </div>
                    {app.applied_at ? (
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        Applied {formatDateTime(app.applied_at)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {detail.cvs.length > 0 ? (
            <Section icon={Download} title="CVs / Resumes">
              <ul className="space-y-2">
                {detail.cvs.map((cv) => (
                  <li
                    key={cv.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      {canPreviewFilename(cv.filename) ? (
                        <button
                          type="button"
                          onClick={() => setPreviewCv(cv)}
                          className="block max-w-full truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                          title={`Preview ${cv.filename}`}
                        >
                          {cv.filename}
                        </button>
                      ) : (
                        <p className="truncate text-sm font-medium text-foreground">{cv.filename}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {cv.file_size != null ? formatFileSize(cv.file_size) : "—"}
                        {cv.uploaded_at ? ` · ${formatDateTime(cv.uploaded_at)}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {canPreviewFilename(cv.filename) ? (
                        <button
                          type="button"
                          onClick={() => setPreviewCv(cv)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          <Eye className="size-3.5" aria-hidden />
                          Preview
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={downloadingCvId === cv.id}
                        onClick={() => void handleDownloadCv(cv.id, cv.filename)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                      >
                        {downloadingCvId === cv.id ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Download className="size-3.5" aria-hidden />
                        )}
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {detail.social_links.length > 0 ? (
            <Section icon={ExternalLink} title="Social Links">
              <ul className="space-y-2">
                {detail.social_links.map((link) => (
                  <li key={`${link.platform}-${link.url}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <span className="font-medium capitalize">{link.platform}</span>
                      <ExternalLink className="size-3 opacity-70" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {/* Actions */}
          <section className="space-y-3 px-5 py-5">
            <h3 className="text-sm font-semibold text-foreground">Actions</h3>
            <div className="flex full-width justify-between  gap-2">
              {canApproveReject && detail.approval_status !== "approved" ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApproval("approved")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  Approve User
                </button>
              ) : null}
              {canApproveReject && detail.approval_status !== "rejected" ? (
                <button
                  type="button"
                  disabled={actionLoading || isSelf}
                  title={isSelf ? "You cannot reject your own account" : undefined}
                  onClick={() => handleApproval("rejected")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  Reject User
                </button>
              ) : null}
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleResetPassword}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <KeyRound className="size-4" aria-hidden />
                Reset Password
              </button>
              {canRemoveUser ? (
                <button
                  type="button"
                  disabled={actionLoading || isSelf}
                  title={isSelf ? "You cannot delete your own account" : undefined}
                  onClick={handleDeleteUser}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Remove User
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-border/80 bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Close
            </button>
          </section>
        </>
      ) : null}
      <AdminUserCvPreviewModal
        userId={userId}
        cv={previewCv}
        onClose={() => setPreviewCv(null)}
        onDownload={
          previewCv && userId != null
            ? () => void handleDownloadCv(previewCv.id, previewCv.filename)
            : undefined
        }
      />
    </SidePanel>
  );
}
