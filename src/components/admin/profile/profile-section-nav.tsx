"use client";

import { useEffect, useState } from "react";
import { KeyRound, Link2, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileSectionId =
  | "personal-info"
  | "change-password"
  | "two-factor"
  | "social-links";

type SectionItem = {
  id: ProfileSectionId;
  label: string;
  icon: LucideIcon;
};

export const PROFILE_SECTIONS: SectionItem[] = [
  { id: "personal-info", label: "Personal Information", icon: UserRound },
  { id: "change-password", label: "Change Password", icon: KeyRound },
  { id: "two-factor", label: "Two-Factor Authentication", icon: ShieldCheck },
  { id: "social-links", label: "Social Links", icon: Link2 },
];

export function ProfileSectionNav() {
  const [active, setActive] = useState<ProfileSectionId>(PROFILE_SECTIONS[0]!.id);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = PROFILE_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target?.id;
        if (top) setActive(top as ProfileSectionId);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: ProfileSectionId) {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    setActive(id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <nav aria-label="Profile sections" className="lg:sticky lg:top-24">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
        {PROFILE_SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>

      <ul className="hidden flex-col gap-1 rounded-2xl border border-border bg-card p-2 shadow-sm lg:flex">
        {PROFILE_SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{s.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
