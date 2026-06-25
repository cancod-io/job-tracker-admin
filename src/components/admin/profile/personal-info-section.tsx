"use client";

import { cn } from "@/lib/utils";
import { AvatarUploader } from "@/components/admin/profile/avatar-uploader";
import { ProfileSectionCard } from "@/components/admin/profile/profile-section-card";
import type { ProfileFormErrors, ProfileFormState } from "@/components/admin/profile/profile-helpers";

type PersonalInfoSectionProps = {
  state: ProfileFormState;
  errors: ProfileFormErrors;
  onChange: (patch: Partial<ProfileFormState>) => void;
  avatarUrl: string | null;
  fallbackInitials: string;
  avatarRefreshKey: number;
  onAvatarChange: (url: string | null) => void;
  onAvatarRefresh: () => void;
  onToastSuccess: (message: string) => void;
  onToastError: (message: string) => void;
  disabled?: boolean;
};

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold text-muted-foreground">
      {children}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function PersonalInfoSection({
  state,
  errors,
  onChange,
  avatarUrl,
  fallbackInitials,
  avatarRefreshKey,
  onAvatarChange,
  onAvatarRefresh,
  onToastSuccess,
  onToastError,
  disabled = false,
}: PersonalInfoSectionProps) {
  return (
    <ProfileSectionCard
      id="personal-info"
      title="Personal Information"
      description="Update your name, contact email, and location."
    >
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_15rem]">
        <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-none">
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel htmlFor="profile-full-name">Full Name</FieldLabel>
            <input
              id="profile-full-name"
              type="text"
              autoComplete="name"
              maxLength={120}
              required
              value={state.full_name}
              onChange={(e) => onChange({ full_name: e.target.value })}
              disabled={disabled}
              aria-invalid={errors.full_name ? true : undefined}
              aria-describedby={errors.full_name ? "profile-full-name-error" : undefined}
              className={cn("form-control w-full")}
            />
            <FieldError id="profile-full-name-error" message={errors.full_name} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <input
              id="profile-email"
              type="email"
              autoComplete="email"
              maxLength={255}
              required
              value={state.email}
              onChange={(e) => onChange({ email: e.target.value })}
              disabled={disabled}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "profile-email-error" : undefined}
              className={cn("form-control w-full")}
            />
            <FieldError id="profile-email-error" message={errors.email} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="profile-country">Country</FieldLabel>
            <input
              id="profile-country"
              type="text"
              autoComplete="country-name"
              maxLength={120}
              value={state.country}
              onChange={(e) => onChange({ country: e.target.value })}
              disabled={disabled}
              placeholder="e.g. United States"
              className="form-control w-full"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="profile-city">City</FieldLabel>
            <input
              id="profile-city"
              type="text"
              autoComplete="address-level2"
              maxLength={120}
              value={state.city}
              onChange={(e) => onChange({ city: e.target.value })}
              disabled={disabled}
              placeholder="e.g. San Francisco"
              className="form-control w-full"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="profile-zip">Zip Code</FieldLabel>
            <input
              id="profile-zip"
              type="text"
              autoComplete="postal-code"
              maxLength={32}
              value={state.zip_code}
              onChange={(e) => onChange({ zip_code: e.target.value })}
              disabled={disabled}
              placeholder="e.g. 94105"
              className="form-control w-full"
            />
          </div>
        </div>

        <div className="order-1 border-b border-border/60 pb-6 lg:order-none lg:border-b-0 lg:border-l lg:border-border/60 lg:pb-0 lg:pl-6">
          <AvatarUploader
            url={avatarUrl}
            fallback={fallbackInitials}
            avatarRefreshKey={avatarRefreshKey}
            onAvatarChange={onAvatarChange}
            onAvatarRefresh={onAvatarRefresh}
            onSuccess={onToastSuccess}
            onError={onToastError}
          />
        </div>
      </div>
    </ProfileSectionCard>
  );
}
