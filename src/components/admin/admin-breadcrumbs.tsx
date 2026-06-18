"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  jobs: "Jobs",
  users: "Users",
  companies: "Companies",
  "scam-urls": "Block Lists",
  "career-urls": "Career URLs",
  scrapers: "Scrapers",
  logs: "Logs",
  permissions: "Role Permissions",
  settings: "Settings",
  "api-config": "API Configuration",
  login: "Sign in",
  register: "Register",
};

function labelForSegment(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ");
}

export function AdminBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { href: string; label: string }[] = [{ href: "/", label: "Home" }];

  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ href: acc, label: labelForSegment(seg) });
  }

  if (crumbs.length <= 1) {
    return (
      <nav aria-label="Breadcrumb" className={cn("text-sm text-muted-foreground", className)}>
        <ol className="flex flex-wrap items-center gap-1">
          <li className="inline-flex items-center gap-1 font-medium text-foreground">
            <Home className="size-3.5 shrink-0 opacity-70" aria-hidden />
            Overview
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="inline-flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
              ) : null}
              {isLast ? (
                <span className="font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href as "/"}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {i === 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Home className="size-3.5 shrink-0 opacity-70" aria-hidden />
                      {crumb.label}
                    </span>
                  ) : (
                    crumb.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
