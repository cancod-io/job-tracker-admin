import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-4 border-b border-border/70 pb-6 md:pb-8", className)}>
      <nav aria-label="Breadcrumb" className="overflow-x-auto">
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            const showHome = i === 0;
            return (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 ? (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground/80"
                    aria-hidden
                  />
                ) : null}
                {showHome ? (
                  <Home className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                ) : null}
                {isLast || !crumb.href ? (
                  <span
                    className={cn(isLast ? "font-medium text-foreground" : "text-muted-foreground")}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
