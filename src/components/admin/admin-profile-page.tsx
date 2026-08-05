"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { ChangePasswordSection } from "@/components/admin/profile/change-password-section";
import { FaceRecognitionSection } from "@/components/admin/profile/face-recognition-section";
import { PasskeysSection } from "@/components/admin/profile/passkeys-section";
import { PersonalInfoSection } from "@/components/admin/profile/personal-info-section";
import { ProfileSectionNav } from "@/components/admin/profile/profile-section-nav";
import { SocialLinksSection } from "@/components/admin/profile/social-links-section";
import {
  buildProfilePatch,
  EMPTY_PROFILE_FORM,
  formsEqual,
  hasProfileFormErrors,
  profileToFormState,
  validateProfileForm,
  type ProfileFormState,
} from "@/components/admin/profile/profile-helpers";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { fetchProfile, updateProfile } from "@/lib/profile-api";
import { useAuth } from "@/providers/auth-provider";
import type { ProfileResponse } from "@/types/profile";
import { cn } from "@/lib/utils";

function avatarInitials(fullName: string, email: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function AdminProfilePage() {
  const { accessToken, refreshSession } = useAuth();
  const { toast, setToast, showSuccess, showError } = useToast();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

  const [formState, setFormState] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [submitted, setSubmitted] = useState(false);
  const originalRef = useRef<ProfileFormState>(EMPTY_PROFILE_FORM);
  const hydratedRef = useRef(false);

  const loadProfile = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchProfile(accessToken);
      setProfile(data);
      if (!hydratedRef.current) {
        const next = profileToFormState(data);
        originalRef.current = next;
        setFormState(next);
        setSubmitted(false);
        hydratedRef.current = true;
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleChange = useCallback((patch: Partial<ProfileFormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
  }, []);

  const errors = useMemo(() => validateProfileForm(formState), [formState]);
  const dirty = !formsEqual(formState, originalRef.current);

  async function handleSave() {
    if (!accessToken) return;
    setSubmitted(true);
    if (hasProfileFormErrors(errors)) {
      showError("Please fix the highlighted fields before saving.");
      return;
    }
    const patch = buildProfilePatch(formState, originalRef.current);
    if (Object.keys(patch).length === 0) {
      setToast({ kind: "success", message: "Nothing to save." });
      return;
    }

    setSaving(true);
    try {
      const data = await updateProfile(accessToken, patch);
      setProfile(data);
      const next = profileToFormState(data);
      originalRef.current = next;
      setFormState(next);
      setSubmitted(false);
      showSuccess("Profile updated.");
      await refreshSession();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFormState(originalRef.current);
    setSubmitted(false);
  }

  function handleAvatarChange(url: string | null) {
    setProfile((prev) => (prev ? { ...prev, profile_picture_url: url } : prev));
  }

  function handleAvatarRefresh() {
    setAvatarRefreshKey((k) => k + 1);
  }

  const headerActions = (
    <>
      <button
        type="button"
        onClick={handleCancel}
        disabled={saving || !dirty}
        className={cn(
          "inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:flex-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving || !dirty}
        className={cn(
          "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:flex-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {saving ? <Spinner className="size-4 text-primary-foreground" /> : null}
        Save Changes
      </button>
    </>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" aria-hidden />
              <h1 className="text-xl font-semibold text-foreground md:text-2xl">Profile Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your personal information and account preferences.
            </p>
          </div>
        </div>
        <div className="space-y-4" aria-busy="true" aria-label="Loading profile">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserRound className="size-5 text-primary" aria-hidden />
            <h1 className="text-xl font-semibold text-foreground md:text-2xl">Profile Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your personal information and account preferences.
          </p>
        </div>
        <AlertBanner>
          {loadError ?? "Could not load your profile."}
          <button
            type="button"
            onClick={() => void loadProfile()}
            className="ml-2 font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </AlertBanner>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ListNotifications toast={toast} error={null} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserRound className="size-5 text-primary" aria-hidden />
            <h1 className="text-xl font-semibold text-foreground md:text-2xl">Profile Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your personal information and account preferences.
          </p>
        </div>
        <div className="flex gap-2 sm:shrink-0">{headerActions}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <ProfileSectionNav />

        <div className="min-w-0 space-y-6">
          <PersonalInfoSection
            state={formState}
            errors={submitted ? errors : {}}
            onChange={handleChange}
            avatarUrl={profile.profile_picture_url}
            fallbackInitials={avatarInitials(profile.full_name, profile.email)}
            avatarRefreshKey={avatarRefreshKey}
            onAvatarChange={handleAvatarChange}
            onAvatarRefresh={handleAvatarRefresh}
            onToastSuccess={showSuccess}
            onToastError={showError}
            disabled={saving}
          />

          <ChangePasswordSection onSuccess={showSuccess} onError={showError} />

          <PasskeysSection onSuccess={showSuccess} onError={showError} />

          <FaceRecognitionSection onSuccess={showSuccess} onError={showError} />

          <SocialLinksSection
            state={formState}
            errors={submitted ? errors : {}}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}
