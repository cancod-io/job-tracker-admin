"use client";

import { Loader2 } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";

type ConfirmDialogFooterProps = {
  error: string | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  centered?: boolean;
};

export function ConfirmDialogFooter({
  error,
  busy,
  onClose,
  onConfirm,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  centered = false,
}: ConfirmDialogFooterProps) {
  return (
    <>
      {error ? <AlertBanner className="mt-3">{error}</AlertBanner> : null}
      <div
        className={
          centered
            ? "mt-6 flex items-center justify-center gap-3"
            : "mt-5 flex flex-wrap items-center justify-end gap-2"
        }
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className={
            centered
              ? "min-w-[7rem] rounded-lg border border-border/80 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
              : "rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          }
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={
            centered
              ? "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-60"
              : "inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-60"
          }
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : null}
          {confirmLabel}
        </button>
      </div>
    </>
  );
}
