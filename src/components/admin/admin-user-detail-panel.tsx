"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Ban,
  Briefcase,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import { SidePanel } from "@/components/ui/side-panel";
import { ApplicantAvatar } from "@/components/admin/applicant-avatar";
import { AdminUserCvPreviewModal } from "@/components/admin/admin-user-cv-preview-modal";
import { AdminUserPermissionsEditor } from "@/components/admin/admin-user-permissions-editor";
import { AdminUserRoleSection } from "@/components/admin/admin-user-role-section";
import { AdminUserSocialLinksSection } from "@/components/admin/admin-user-social-links-section";
import { DetailRow } from "@/components/admin/shared/detail-row";
import { DetailSection } from "@/components/admin/shared/detail-section";
import {
  deleteAdminUser,
  downloadUserCv,
  getAdminUser,
  patchUserApproval,
  patchUserRole,
  resetUserPassword,
} from "@/lib/admin-user-api";
import { formatFileSize } from "@/lib/admin-file-utils";
import { hasAnySocialLink } from "@/lib/admin-user-social";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { formatDateTime } from "@/lib/format-date";
import { useUserUpdatedRealtime } from "@/hooks/use-user-updated-realtime";
import { useUsersApplicationStatsRealtime } from "@/hooks/use-users-application-stats-realtime";
import { formatAnalyticsNumber } from "@/lib/analytics-utils";
import { applicantBadgeClass, formatApplicantStatus } from "@/lib/applicant-status";
import {
  approvalBadgeClass,
  approvalLabel,
  formatApprovedBy,
  roleLabel,
} from "@/lib/user-approval";
import { cn } from "@/lib/utils";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import type { AdminUserCv, AdminUserDetail } from "@/types/admin-user-api";
import type { UserApprovalStatus, UserRole } from "@/types/auth";

type AdminUserDetailPanelProps = {
  userId: number | null;
  onClose: () => void;
  onUpdated: () => void;
  layout?: "drawer" | "page";
};

type UserDetailTab = "account" | "permissions" | "applications";

const PAGE_TABS: { id: UserDetailTab; label: string; icon: typeof UserRound }[] = [
  { id: "account", label: "Account information", icon: UserRound },
  { id: "permissions", label: "Permission settings", icon: Shield },
  { id: "applications", label: "Applications", icon: Briefcase },
];

export function AdminUserDetailPanel({
  userId,
  onClose,
  onUpdated,
  layout = "drawer",
}: AdminUserDetailPanelProps) {
  const { accessToken, user: currentUser } = useAuth();
  const { can } = useAdminPermissions();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingCvId, setDownloadingCvId] = useState<number | null>(null);
  const [previewCv, setPreviewCv] = useState<AdminUserCv | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<UserDetailTab>("account");
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applicationStats = useUsersApplicationStatsRealtime();

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

  const userUpdated = useUserUpdatedRealtime();

  useEffect(() => {
    if (userId == null || userUpdated?.user_id !== userId) return;
    void load();
  }, [userId, userUpdated, load]);

  useEffect(() => {
    setActiveTab("account");
  }, [userId]);

  useEffect(() => {
    setCopied(false);
  }, [userId, detail?.email]);

  useEffect(
    () => () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    },
    [],
  );

  const isSelf = currentUser != null && userId != null && currentUser.id === userId;
  const canApproveReject = can("users.approve");
  const canRemoveUser = can("users.delete");
  const canResetPassword = can("users.reset_password");
  const canChangeRole = can("users.change_role");
  const canManagePermissions = can("permissions.manage");

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

  const handleSaveRole = async (role: UserRole) => {
    if (!accessToken || userId == null) return;
    await runAction(() => patchUserRole(accessToken, userId, role));
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

  const copyEmail = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!detail?.email?.trim()) return;
    try {
      await copyTextToClipboard(detail.email);
      setError(null);
      setCopied(true);
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setError("Could not copy email to clipboard.");
    }
  };

  const isPageLayout = layout === "page";

  const renderQuickActions = (detail: AdminUserDetail) => (
    <div className="flex flex-wrap items-center gap-2">
      {canApproveReject && detail.approval_status !== "approved" ? (
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => handleApproval("approved")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Approve
        </button>
      ) : null}
      {canApproveReject && detail.approval_status !== "rejected" ? (
        <button
          type="button"
          disabled={actionLoading || isSelf}
          title={isSelf ? "You cannot reject your own account" : undefined}
          onClick={() => handleApproval("rejected")}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3.5 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-100"
        >
          <Ban className="size-4 shrink-0" aria-hidden />
          Reject
        </button>
      ) : null}
      {canResetPassword ? (
        <button
          type="button"
          disabled={actionLoading}
          onClick={handleResetPassword}
          className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <KeyRound className="size-4 shrink-0" aria-hidden />
          Reset password
        </button>
      ) : null}
      {canRemoveUser ? (
        <button
          type="button"
          disabled={actionLoading || isSelf}
          title={isSelf ? "You cannot delete your own account" : undefined}
          onClick={handleDeleteUser}
          className="inline-flex items-center gap-2 rounded-lg border border-destructive/35 bg-destructive/10 px-3.5 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
        >
          <Trash2 className="size-4 shrink-0" aria-hidden />
          Remove
        </button>
      ) : null}
    </div>
  );

  const renderAccountSection = (detail: AdminUserDetail) => {
    const accountFields = (
      <dl>
        <DetailRow label="Full Name">{detail.full_name || "—"}</DetailRow>
        <DetailRow label="Email">{detail.email || "—"}</DetailRow>
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
    );

    const profileFields = (
      <dl>
        <DetailRow label="Country">{detail.country || "—"}</DetailRow>
        <DetailRow label="City">{detail.city || "—"}</DetailRow>
        <DetailRow label="Zip Code">{detail.zip_code || "—"}</DetailRow>
        <DetailRow label="Bio">
          {detail.bio ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{detail.bio}</p>
          ) : (
            "—"
          )}
        </DetailRow>
      </dl>
    );

    if (isPageLayout) {
      return (
        <div className="grid gap-6 p-6 lg:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-muted/15 p-5 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="size-4 text-primary" aria-hidden />
              <h3 className="text-sm font-semibold text-foreground">Account information</h3>
            </div>
            {accountFields}
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/15 p-5 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="size-4 text-primary" aria-hidden />
              <h3 className="text-sm font-semibold text-foreground">Profile</h3>
            </div>
            {profileFields}
          </div>

          <div className="space-y-6 lg:col-span-2 xl:col-span-1">
            {hasAnySocialLink(detail.social) ? (
              <div className="rounded-xl border border-border/80 bg-muted/15 p-5">
                <AdminUserSocialLinksSection social={detail.social} embedded />
              </div>
            ) : null}

            {detail.cvs.length > 0 ? (
              <div className="rounded-xl border border-border/80 bg-muted/15 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Download className="size-4 text-primary" aria-hidden />
                  <h3 className="text-sm font-semibold text-foreground">CVs / resumes</h3>
                </div>
                <ul className="space-y-2">
                  {detail.cvs.map((cv) => (
                    <li
                      key={cv.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setPreviewCv(cv)}
                          className="block max-w-full truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                          title={`Preview ${cv.filename}`}
                        >
                          {cv.filename}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {cv.file_size != null ? formatFileSize(cv.file_size) : "—"}
                          {cv.uploaded_at ? ` · ${formatDateTime(cv.uploaded_at)}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewCv(cv)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          <Eye className="size-3.5" aria-hidden />
                          Preview
                        </button>
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
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <>
        <DetailSection icon={UserRound} title="Account Information">
          {accountFields}
        </DetailSection>

        <DetailSection icon={UserRound} title="Profile">
          {profileFields}
        </DetailSection>

        <AdminUserSocialLinksSection social={detail.social} />

        {detail.cvs.length > 0 ? (
          <DetailSection icon={Download} title="CVs / Resumes">
            <ul className="space-y-2">
              {detail.cvs.map((cv) => (
                <li
                  key={cv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setPreviewCv(cv)}
                      className="block max-w-full truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                      title={`Preview ${cv.filename}`}
                    >
                      {cv.filename}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {cv.file_size != null ? formatFileSize(cv.file_size) : "—"}
                      {cv.uploaded_at ? ` · ${formatDateTime(cv.uploaded_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewCv(cv)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Eye className="size-3.5" aria-hidden />
                      Preview
                    </button>
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
          </DetailSection>
        ) : null}

        <section className="border-t border-border/60 px-5 py-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Account actions
          </h3>
          {renderQuickActions(detail)}
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Close
          </button>
        </section>
      </>
    );
  };

  const renderPermissionsSection = (detail: AdminUserDetail) => {
    const approvalBlock = (
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
      </dl>
    );

    if (isPageLayout) {
      return (
        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border/80 bg-muted/15 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="size-4 text-primary" aria-hidden />
                <h3 className="text-sm font-semibold text-foreground">Approval & access</h3>
              </div>
              {approvalBlock}
            </div>

            <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/15">
              <AdminUserRoleSection
                currentRole={detail.role}
                canEdit={canChangeRole}
                isSelf={isSelf}
                saving={actionLoading}
                onSave={handleSaveRole}
                embedded
              />
            </div>
          </div>

          {canManagePermissions && userId != null ? (
            <div className="rounded-xl border border-border/80 bg-muted/15 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="size-4 text-primary" aria-hidden />
                <h3 className="text-sm font-semibold text-foreground">Permission overrides</h3>
              </div>
              <AdminUserPermissionsEditor
                userId={userId}
                userName={detail.full_name || detail.email}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 p-10 text-sm text-muted-foreground">
              You do not have permission to manage user access overrides.
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <DetailSection icon={Shield} title="Approval & access">
          {approvalBlock}
        </DetailSection>

        <AdminUserRoleSection
          currentRole={detail.role}
          canEdit={canChangeRole}
          isSelf={isSelf}
          saving={actionLoading}
          onSave={handleSaveRole}
        />

        {canManagePermissions && userId != null ? (
          <section className="border-b border-border/60 px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="size-4 text-primary" aria-hidden />
              <h3 className="text-sm font-semibold text-foreground">Permission overrides</h3>
            </div>
            <AdminUserPermissionsEditor
              userId={userId}
              userName={detail.full_name || detail.email}
            />
          </section>
        ) : null}
      </>
    );
  };

  const renderApplicationsSection = (detail: AdminUserDetail) => {
    const liveStats =
      userId != null ? applicationStats?.users.find((row) => row.user_id === userId) : null;
    const totalApplications =
      liveStats?.application_count ?? detail.job_applications.length;
    const todayApplications = liveStats?.applications_today ?? 0;

    const statusTags = [...detail.job_applications.reduce((map, app) => {
      map.set(app.status, (map.get(app.status) ?? 0) + 1);
      return map;
    }, new Map<string, number>())].sort((a, b) => b[1] - a[1]);

    return (
      <div className={cn(isPageLayout ? "space-y-6 p-6" : undefined)}>
        <section className={cn(!isPageLayout && "border-b border-border/60 px-5 py-4")}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-primary" aria-hidden />
              <h3 className="text-sm font-semibold text-foreground">Application summary</h3>
            </div>
            {isPageLayout ? (
              <p className="text-xs text-muted-foreground">Live counts from WebSocket</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground">
              Total: {formatAnalyticsNumber(totalApplications)}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium",
                todayApplications > 0
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-border/80 bg-muted/40 text-muted-foreground",
              )}
            >
              Today: {formatAnalyticsNumber(todayApplications)}
            </span>
            {statusTags.map(([status, count]) => (
              <span
                key={status}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                  applicantBadgeClass(status),
                )}
              >
                {formatApplicantStatus(status)}
                <span className="tabular-nums opacity-80">{count}</span>
              </span>
            ))}
          </div>
        </section>

        {isPageLayout ? (
          <div className="overflow-hidden rounded-xl border border-border/80">
            {detail.job_applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Job title</th>
                      <th className="px-4 py-3 font-medium">Company</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.job_applications.map((app) => (
                      <tr
                        key={app.application_id}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{app.job_title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{app.company || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              applicantBadgeClass(app.status),
                            )}
                          >
                            {formatApplicantStatus(app.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                          {app.applied_at ? formatDateTime(app.applied_at) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                No job applications yet.
              </p>
            )}
          </div>
        ) : (
          <DetailSection icon={Briefcase} title="Job applications">
            {detail.job_applications.length > 0 ? (
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
            ) : (
              <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-8 text-center text-sm text-muted-foreground">
                No job applications yet.
              </p>
            )}
          </DetailSection>
        )}
      </div>
    );
  };

  const detailBody =
    loading && !detail ? (
      <div className="flex items-center justify-center gap-2 px-5 py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Loading profile…
      </div>
    ) : error && !detail ? (
      <div className="space-y-4 px-5 py-8">
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
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
          {isPageLayout ? (
            <>
              <div className="border-b border-border/60 bg-gradient-to-r from-muted/30 via-card to-card px-6 py-6 lg:px-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 items-start gap-5">
                    <ApplicantAvatar
                      userId={detail.id}
                      name={detail.full_name || detail.email}
                      profilePictureUrl={detail.profile_picture_url}
                      hasAvatar={detail.has_avatar}
                      attemptFetch
                      sizeClass="size-20"
                      textClass="text-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                          {detail.full_name || detail.email}
                        </h1>
                        {isSelf ? (
                          <span className="inline-flex rounded-full border border-primary/35 bg-primary/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Your account
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            approvalBadgeClass(detail.approval_status),
                          )}
                        >
                          {approvalLabel(detail.approval_status)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <Mail className="size-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{detail.email}</span>
                          <button
                            type="button"
                            onClick={(e) => void copyEmail(e)}
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition-colors",
                              copied
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                            aria-label={
                              copied ? "Email copied to clipboard" : "Copy email to clipboard"
                            }
                          >
                            {copied ? (
                              <CheckCircle2 className="size-3.5" aria-hidden />
                            ) : (
                              <Copy className="size-3.5" aria-hidden />
                            )}
                            {copied ? "Copied" : "Copy"}
                          </button>
                          <span className="sr-only" role="status" aria-live="polite">
                            {copied ? "Email copied to clipboard." : ""}
                          </span>
                        </span>
                        <span>
                          User ID:{" "}
                          <span className="font-medium tabular-nums text-foreground">
                            USR-{detail.id}
                          </span>
                        </span>
                        <span>
                          Role:{" "}
                          <span className="font-medium text-foreground">
                            {roleLabel(detail.role)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 xl:max-w-xl">{renderQuickActions(detail)}</div>
                </div>
              </div>

              {(() => {
                const liveStats =
                  userId != null
                    ? applicationStats?.users.find((row) => row.user_id === userId)
                    : null;
                const totalApplications =
                  liveStats?.application_count ?? detail.job_applications.length;
                const todayApplications = liveStats?.applications_today ?? 0;

                return (
                  <div className="grid grid-cols-2 gap-3 border-b border-border/60 px-6 py-4 lg:grid-cols-4 lg:px-8">
                    {[
                      { label: "Total applications", value: formatAnalyticsNumber(totalApplications) },
                      {
                        label: "Applications today",
                        value: formatAnalyticsNumber(todayApplications),
                        highlight: todayApplications > 0,
                      },
                      {
                        label: "Last login",
                        value: detail.last_login_at ? formatDateTime(detail.last_login_at) : "Never",
                        small: true,
                      },
                      {
                        label: "Member since",
                        value: formatDateTime(detail.created_at),
                        small: true,
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-border/80 bg-muted/15 px-4 py-3"
                      >
                        <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                        <p
                          className={cn(
                            "mt-1 font-semibold tabular-nums text-foreground",
                            stat.small ? "text-sm" : "text-xl",
                            stat.highlight && "text-primary",
                          )}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          ) : (
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
                    <p className="truncate text-lg font-semibold text-foreground">
                      {detail.full_name}
                    </p>
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
                      onClick={(e) => void copyEmail(e)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium transition-colors",
                        copied
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      aria-label={copied ? "Email copied to clipboard" : "Copy email to clipboard"}
                    >
                      {copied ? (
                        <CheckCircle2 className="size-3.5" aria-hidden />
                      ) : (
                        <Copy className="size-3.5" aria-hidden />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    User ID: <span className="tabular-nums text-foreground">USR-{detail.id}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Role: <span className="text-foreground">{roleLabel(detail.role)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {error ? (
            <p
              className={cn(
                "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                isPageLayout ? "mx-6 mt-4 lg:mx-8" : "mx-5 mt-4",
              )}
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {isPageLayout ? (
            <>
              <div
                className="border-b border-border/60 px-6 lg:px-8"
                role="tablist"
                aria-label="User detail sections"
              >
                <div className="flex flex-wrap gap-1">
                  {PAGE_TABS.map(({ id, label, icon: Icon }) => {
                    const liveStats =
                      userId != null
                        ? applicationStats?.users.find((row) => row.user_id === userId)
                        : null;
                    const tabLabel =
                      id === "applications"
                        ? `${label} (${formatAnalyticsNumber(liveStats?.application_count ?? detail.job_applications.length)})`
                        : label;

                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                          "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                          activeTab === id
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                        {tabLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div role="tabpanel" className="min-h-[24rem]">
                {activeTab === "account" ? renderAccountSection(detail) : null}
                {activeTab === "permissions" ? renderPermissionsSection(detail) : null}
                {activeTab === "applications" ? renderApplicationsSection(detail) : null}
              </div>
            </>
          ) : (
            <>
              {renderAccountSection(detail)}
              {renderPermissionsSection(detail)}
              {renderApplicationsSection(detail)}
            </>
          )}
        </>
      ) : null;

  const cvPreviewModal = (
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
  );

  if (isPageLayout) {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        {detailBody}
        {cvPreviewModal}
      </div>
    );
  }

  return (
    <SidePanel
      open={userId != null}
      aria-label="User details"
      title="User Details"
      onClose={onClose}
      widthClass="w-full max-w-md sm:max-w-[31rem]"
    >
      {detailBody}
      {cvPreviewModal}
    </SidePanel>
  );
}
