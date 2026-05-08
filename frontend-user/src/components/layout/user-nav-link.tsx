"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserNavItem } from "@/config/user-nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type UserNavVariant = "sidebar" | "topbar";

type UserNavLinkProps = {
  item: UserNavItem;
  onNavigate?: () => void;
  className?: string;
  variant?: UserNavVariant;
};

export function UserNavLink({
  item,
  onNavigate,
  className,
  variant = "sidebar",
}: UserNavLinkProps) {
  const pathname = usePathname() ?? "/";
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none",
        variant === "topbar"
          ? cn(
              "rounded-full px-3.5 py-2",
              active
                ? "bg-primary/12 dark:bg-primary/18 text-primary shadow-sm ring-1 ring-primary/25 dark:text-primary dark:ring-primary/35"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )
          : cn(
              "gap-3 rounded-lg px-3 py-2.5",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ),
        className,
      )}
    >
      <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
      {item.label}
    </Link>
  );
}
