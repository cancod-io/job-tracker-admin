"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type SidePanelProps = {
  open: boolean;
  "aria-label": string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  widthClass?: string;
};

export function SidePanel({
  open,
  "aria-label": ariaLabel,
  title,
  onClose,
  children,
  className,
  widthClass = "w-full max-w-md sm:max-w-lg",
}: SidePanelProps) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-background/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close panel"
        tabIndex={-1}
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex flex-col border-l border-border/80 bg-card shadow-2xl",
          widthClass,
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
