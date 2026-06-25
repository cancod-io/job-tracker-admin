"use client";

import { Github, Globe, Linkedin, Twitter, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileSectionCard } from "@/components/admin/profile/profile-section-card";
import type { ProfileFormErrors, ProfileFormState } from "@/components/admin/profile/profile-helpers";

type SocialLinksSectionProps = {
  state: ProfileFormState;
  errors: ProfileFormErrors;
  onChange: (patch: Partial<ProfileFormState>) => void;
  disabled?: boolean;
};

type SocialFieldKey = "linkedin_url" | "twitter_url" | "github_url" | "portfolio_url";

type SocialField = {
  key: SocialFieldKey;
  label: string;
  icon: LucideIcon;
  placeholder: string;
};

const FIELDS: SocialField[] = [
  { key: "linkedin_url", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/yourname" },
  { key: "twitter_url", label: "Twitter / X", icon: Twitter, placeholder: "https://twitter.com/yourhandle" },
  { key: "github_url", label: "GitHub", icon: Github, placeholder: "https://github.com/yourname" },
  { key: "portfolio_url", label: "Portfolio / Website", icon: Globe, placeholder: "https://yourdomain.dev" },
];

export function SocialLinksSection({
  state,
  errors,
  onChange,
  disabled = false,
}: SocialLinksSectionProps) {
  return (
    <ProfileSectionCard
      id="social-links"
      title="Social Links"
      description="Add your professional social media and portfolio links."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map(({ key, label, icon: Icon, placeholder }) => {
          const error = errors[key];
          const inputId = `profile-${key}`;
          return (
            <div key={key} className="space-y-1.5">
              <label
                htmlFor={inputId}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {label}
              </label>
              <input
                id={inputId}
                type="url"
                inputMode="url"
                maxLength={500}
                value={state[key]}
                onChange={(e) => onChange({ [key]: e.target.value } as Partial<ProfileFormState>)}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${inputId}-error` : undefined}
                placeholder={placeholder}
                className={cn("form-control w-full")}
              />
              {error ? (
                <p id={`${inputId}-error`} role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </ProfileSectionCard>
  );
}
