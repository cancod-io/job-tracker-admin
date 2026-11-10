import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProfileSectionCardProps = {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ProfileSectionCard({
  id,
  title,
  description,
  action,
  children,
  className,
}: ProfileSectionCardProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 id={`${id}-title`} className="text-base font-semibold text-foreground md:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="text-xs text-muted-foreground md:text-sm">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}
