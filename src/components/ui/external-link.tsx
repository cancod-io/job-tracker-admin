import { cn } from "@/lib/utils";

type ExternalLinkProps = {
  href: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  truncate?: boolean;
};

export function ExternalLink({
  href,
  children,
  className,
  truncate = true,
}: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex max-w-full items-center gap-1 text-primary hover:underline",
        truncate && "truncate",
        className,
      )}
      title={typeof children === "string" ? children : href}
    >
      <span className={cn(truncate && "truncate")}>{children ?? href}</span>
    </a>
  );
}

type ExternalLinkCellProps = {
  url: string | null;
  className?: string;
};

export function ExternalLinkCell({ url, className }: ExternalLinkCellProps) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <ExternalLink href={url} className={cn("block min-w-0 max-w-full", className)}>
      {url}
    </ExternalLink>
  );
}
