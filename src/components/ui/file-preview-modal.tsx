"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileQuestion, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export type FilePreviewKind = "image" | "pdf" | "text" | "video" | "audio" | "docx" | "embed";

type FilePreviewModalProps = {
  /** When false the modal renders nothing. */
  open: boolean;
  title: string;
  /** Secondary line under the title (e.g. file size). */
  subtitle?: string;
  loading: boolean;
  error: string | null;
  /** Resolved preview type. */
  previewKind: FilePreviewKind | null;
  /** Object URL for the fetched blob. */
  previewUrl: string | null;
  /** Populated when `previewKind` is `text`. */
  previewText?: string | null;
  /** Populated when `previewKind` is `docx`. */
  previewHtml?: string | null;
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
  previewText = null,
  previewHtml = null,
  unsupportedHint = "This file could not be rendered inline. Download it to open in another app.",
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
              <img src={previewUrl} alt={title} className="max-h-full max-w-full object-contain" />
            </div>
          ) : previewKind === "pdf" && previewUrl ? (
            <iframe src={previewUrl} title={title} className="h-full w-full border-0 bg-background" />
          ) : previewKind === "text" && previewText ? (
            <div className="h-full overflow-auto p-4 sm:p-5">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground sm:text-sm">
                {previewText}
              </pre>
            </div>
          ) : previewKind === "docx" && previewHtml ? (
            <div className="h-full overflow-auto bg-background p-6 sm:p-8">
              <div
                className="docx-preview mx-auto max-w-[48rem] text-sm leading-relaxed text-foreground [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_strong]:font-semibold [&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          ) : previewKind === "video" && previewUrl ? (
            <div className="flex h-full w-full items-center justify-center overflow-auto p-3 sm:p-5">
              <video src={previewUrl} controls className="max-h-full max-w-full" playsInline>
                <track kind="captions" />
              </video>
            </div>
          ) : previewKind === "audio" && previewUrl ? (
            <div className="flex h-full w-full items-center justify-center p-6">
              <audio src={previewUrl} controls className="w-full max-w-lg">
                <track kind="captions" />
              </audio>
            </div>
          ) : previewKind === "embed" && previewUrl ? (
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
