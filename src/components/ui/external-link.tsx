import { ExternalLink as ExternalLinkIcon } from "lucide-react";
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
  showIcon = true,
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
      {showIcon ? (
        <ExternalLinkIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      ) : null}
    </a>
  );
}

type ExternalLinkCellProps = {
  url: string | null;
};

export function ExternalLinkCell({ url }: ExternalLinkCellProps) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return <ExternalLink href={url}>{url}</ExternalLink>;
}
