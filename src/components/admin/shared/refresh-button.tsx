"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type RefreshButtonProps = {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  ariaLabel: string;
};

export function RefreshButton({
  onClick,
  loading = false,
  label = "Refresh",
  ariaLabel,
}: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      aria-label={ariaLabel}
    >
      <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
