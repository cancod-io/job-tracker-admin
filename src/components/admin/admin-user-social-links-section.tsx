"use client";

import { ExternalLink, Github, Globe, Linkedin, Twitter, type LucideIcon } from "lucide-react";
import { hasAnySocialLink } from "@/lib/admin-user-social";
import type { AdminUserSocialFields } from "@/types/admin-user-api";

type SocialField = {
  key: keyof AdminUserSocialFields;
  label: string;
  icon: LucideIcon;
};

const FIELDS: SocialField[] = [
  { key: "linkedin_url", label: "LinkedIn", icon: Linkedin },
  { key: "twitter_url", label: "Twitter / X", icon: Twitter },
  { key: "github_url", label: "GitHub", icon: Github },
  { key: "portfolio_url", label: "Portfolio / Website", icon: Globe },
];

type AdminUserSocialLinksSectionProps = {
  social: AdminUserSocialFields;
};

export function AdminUserSocialLinksSection({ social }: AdminUserSocialLinksSectionProps) {
  if (!hasAnySocialLink(social)) return null;

  const populated = FIELDS.filter(({ key }) => Boolean(social[key]?.trim()));

  return (
    <section className="border-b border-border/60 px-5 py-4">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-foreground">Social Links</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Professional social media and portfolio links.
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {populated.map(({ key, label, icon: Icon }) => {
          const url = social[key]!;
          return (
            <div key={key} className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {label}
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/25 px-3 py-2 text-sm text-primary transition-colors hover:bg-muted/50 hover:underline"
                title={url}
              >
                <span className="min-w-0 flex-1 truncate">{url}</span>
                <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
