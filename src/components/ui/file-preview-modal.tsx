"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileQuestion, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export type FilePreviewKind = "image" | "pdf";

type FilePreviewModalProps = {
  /** When false the modal renders nothing. */
  open: boolean;
  title: string;
  /** Secondary line under the title (e.g. file size). */
  subtitle?: string;
  loading: boolean;
  error: string | null;
  /** Resolved preview type, or `null` when the file can't be previewed inline. */
  previewKind: FilePreviewKind | null;
  /** Object URL for the fetched blob. */
  previewUrl: string | null;
  /** Message shown in the "can't preview" fallback. */
  unsupportedHint?: string;
  /** When omitted, the download affordance is hidden (e.g. admin preview-only). */
  onDownload?: () => void;
  onClose: () => void;
};

/**
 * Presentational preview surface: portal, blurred backdrop, header with
 * fullscreen + optional download + close, and a body that renders an image, a
 * PDF iframe, a loading/error state, or a fallback. Data fetching lives in the
 * feature-specific wrapper that supplies `loading`/`error`/`previewUrl`.
 */
export function FilePreviewModal({
  open,
  title,
  subtitle,
  loading,
  error,
  previewKind,
  previewUrl,
  unsupportedHint = "This file type can't be previewed in the browser.",
  onDownload,
  onClose,
}: FilePreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) setFullscreen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[250] flex items-center justify-center",
        fullscreen ? "p-0" : "p-2 sm:p-3 md:p-4",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${title}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close preview"
      />

      <div
        className={cn(
          "relative z-10 flex min-h-0 w-full flex-col overflow-hidden border border-border bg-card shadow-2xl",
          fullscreen
            ? "h-[100dvh] max-w-none rounded-none"
            : "h-[min(94dvh,calc(100dvh-1rem))] max-w-[min(98vw,90rem)] rounded-2xl",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">{title}</h3>
            {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFullscreen((value) => !value)}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={fullscreen ? "Exit fullscreen preview" : "Fullscreen preview"}
              aria-pressed={fullscreen}
            >
              {fullscreen ? (
                <Minimize2 className="size-4" aria-hidden />
              ) : (
                <Maximize2 className="size-4" aria-hidden />
              )}
            </button>
            {onDownload ? (
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Download className="size-3.5 shrink-0" aria-hidden />
                Download
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close preview"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/20">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Spinner className="size-6 border-muted-foreground/30 border-t-foreground" />
              Loading preview…
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-md text-sm text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          ) : previewKind === "image" && previewUrl ? (
            <div className="flex h-full w-full items-center justify-center overflow-auto p-3 sm:p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt={title} className="max-h-full max-w-full object-contain" />
            </div>
          ) : previewKind === "pdf" && previewUrl ? (
            <iframe src={previewUrl} title={title} className="h-full w-full border-0 bg-background" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <FileQuestion className="size-10 text-muted-foreground/70" aria-hidden />
              <p className="max-w-md text-sm text-muted-foreground">{unsupportedHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
