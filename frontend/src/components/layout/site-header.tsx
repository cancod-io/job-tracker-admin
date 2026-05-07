import Link from "next/link";
import { HeaderAuthNav } from "@/components/layout/header-auth-nav";

const navClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75"
      role="banner"
    >
      <div className="container flex h-14 items-center justify-between gap-4 md:h-16">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="truncate text-sm font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-base"
          >
            Shopify Job Tracker
          </Link>
        </div>
        <nav className="flex shrink-0 items-center gap-0.5" aria-label="Primary">
          <a href="#jobs" className={navClass}>
            Jobs
          </a>
          <a href="#applications" className={navClass}>
            Applications
          </a>
          <HeaderAuthNav />
        </nav>
      </div>
    </header>
  );
}
