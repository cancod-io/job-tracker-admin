"use client";

import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ToastMessage } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ToastBannerProps = {
  toast: ToastMessage | null;
  className?: string;
  onDismiss?: () => void;
  /** Floating card for global toasts; inline for page-level banners. */
  layout?: "floating" | "inline";
};

type ToastStyle = {
  icon: LucideIcon;
  title: string;
  accent: string;
  iconWrap: string;
  ring: string;
  surface: string;
};

function toastStyle(kind: ToastMessage["kind"]): ToastStyle {
  switch (kind) {
    case "success":
      return {
        icon: CheckCircle2,
        title: "Success",
        accent: "bg-emerald-500",
        iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        ring: "ring-emerald-500/25",
        surface: "border-emerald-500/20 bg-emerald-500/[0.07] dark:bg-emerald-500/10",
      };
    case "info":
      return {
        icon: Info,
        title: "Update",
        accent: "bg-primary",
        iconWrap: "bg-primary/15 text-primary",
        ring: "ring-primary/25",
        surface: "border-primary/20 bg-primary/[0.07] dark:bg-primary/10",
      };
    default:
      return {
        icon: AlertCircle,
        title: "Attention",
        accent: "bg-destructive",
        iconWrap: "bg-destructive/15 text-destructive",
        ring: "ring-destructive/25",
        surface: "border-destructive/25 bg-destructive/[0.07] dark:bg-destructive/10",
      };
  }
}

export function ToastBanner({
  toast,
  className,
  onDismiss,
  layout = "inline",
}: ToastBannerProps) {
  if (!toast) return null;

  const style = toastStyle(toast.kind);
  const Icon = style.icon;
  const title = toast.title?.trim() || style.title;
  const isFloating = layout === "floating";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border text-foreground shadow-lg backdrop-blur-md",
        style.surface,
        isFloating && "animate-in slide-in-from-top-4 fade-in duration-300",
        isFloating && "ring-1 ring-inset",
        style.ring,
        className,
      )}
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", style.accent)}
        aria-hidden
      />

      <div className="flex items-start gap-3 py-3 pl-4 pr-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
            style.iconWrap,
          )}
          aria-hidden
        >
          <Icon className="size-5" strokeWidth={2.25} />
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
              {title}
            </p>
            {isFloating ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <BellRing className="size-3" aria-hidden />
                Live
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{toast.message}</p>
        </div>

        {onDismiss ? (
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            onClick={onDismiss}
            aria-label="Dismiss notification"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
