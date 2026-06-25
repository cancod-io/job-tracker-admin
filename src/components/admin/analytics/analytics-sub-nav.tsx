"use client";

import {
  BarChart3,
  Briefcase,
  FileText,
  Radar,
  Server,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/analytics/overview", label: "Overview", icon: BarChart3 },
  { href: "/analytics/jobs", label: "Jobs", icon: Briefcase },
  { href: "/analytics/applications", label: "Applications", icon: FileText },
  { href: "/analytics/users", label: "Users", icon: Users },
  { href: "/analytics/scraping", label: "Scraping", icon: Radar },
  { href: "/analytics/workers", label: "Workers", icon: Server },
  { href: "/analytics/targets", label: "Targets", icon: Target },
];

export function AnalyticsSubNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/50 p-2"
      aria-label="Analytics sections"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
