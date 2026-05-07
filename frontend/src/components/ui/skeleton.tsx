import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

/** Use for loading rows, cards, or form placeholders. */
export function Skeleton({ className, "aria-hidden": ariaHidden = true }: SkeletonProps) {
  return (
    <div
      aria-hidden={ariaHidden}
      className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)}
    />
  );
}
