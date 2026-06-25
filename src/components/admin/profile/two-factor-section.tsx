"use client";

import { ShieldCheck } from "lucide-react";
import { ProfileSectionCard } from "@/components/admin/profile/profile-section-card";

export function TwoFactorSection() {
  return (
    <ProfileSectionCard
      id="two-factor"
      title="Two-Factor Authentication (2FA)"
      description="Add an extra layer of security to your account with an authenticator app."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Authenticator app</p>
            <p className="text-xs text-muted-foreground">
              Generate one-time codes from an app like Authy or 1Password.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Coming soon
          </span>
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Enable two-factor authentication (coming soon)"
            title="Coming soon"
          >
            Enable 2FA
          </button>
        </div>
      </div>
    </ProfileSectionCard>
  );
}
