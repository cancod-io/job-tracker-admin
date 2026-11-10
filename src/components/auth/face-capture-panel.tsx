"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, ScanFace } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import {
  captureFaceDescriptor,
  ensureFaceModelsLoaded,
  openUserCamera,
  stopMediaStream,
} from "@/lib/face-api-client";
import type { FaceDescriptor } from "@/types/face-auth";
import { cn } from "@/lib/utils";

type FaceCapturePanelProps = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  /** When true, panel auto-starts camera on mount. */
  autoStart?: boolean;
  disabled?: boolean;
  onCaptured: (descriptor: FaceDescriptor) => Promise<void> | void;
  onCancel?: () => void;
  className?: string;
};

export function FaceCapturePanel({
  title = "Face verification",
  description = "Look at the camera. Hold still when your face is centered in the frame.",
  confirmLabel = "Verify face",
  autoStart = true,
  disabled = false,
  onCaptured,
  onCancel,
  className,
}: FaceCapturePanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      await ensureFaceModelsLoaded();
      setModelsReady(true);
      const stream = await openUserCamera();
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopMediaStream(stream);
        throw new Error("Video element is not available.");
      }
      video.srcObject = stream;
      await video.play();
      setCameraReady(true);
    } catch (e) {
      stopCamera();
      setError(e instanceof Error ? e.message : "Could not start the camera.");
    } finally {
      setStarting(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (autoStart) {
      void startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  async function handleCapture() {
    const video = videoRef.current;
    if (!video || !cameraReady) {
      setError("Camera is not ready yet.");
      return;
    }
    setCapturing(true);
    setError(null);
    try {
      const descriptor = await captureFaceDescriptor(video);
      await onCaptured(descriptor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Face capture failed.");
    } finally {
      setCapturing(false);
    }
  }

  const busy = starting || capturing || disabled;

  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ScanFace className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">{description}</p>
        </div>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-black/90">
        <video
          ref={videoRef}
          className="h-full w-full scale-x-[-1] object-cover"
          playsInline
          muted
          autoPlay
          aria-label="Webcam preview"
        />
        {!cameraReady ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80 text-muted-foreground">
            {starting ? (
              <>
                <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
                <p className="text-sm">
                  {modelsReady ? "Starting camera…" : "Loading face models…"}
                </p>
              </>
            ) : (
              <>
                <Camera className="size-8" aria-hidden />
                <p className="text-sm">Camera preview</p>
              </>
            )}
          </div>
        ) : null}
        {/* Face guide oval */}
        {cameraReady ? (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div className="h-[70%] w-[55%] rounded-[50%] border-2 border-primary/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        ) : null}
      </div>

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            disabled={capturing}
            className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
        {!cameraReady && !starting ? (
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            <Camera className="size-4" aria-hidden />
            Start camera
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void handleCapture()}
          disabled={!cameraReady || busy}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
        >
          {capturing ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <ScanFace className="size-4" aria-hidden />
          )}
          {capturing ? "Capturing…" : confirmLabel}
        </button>
      </div>
    </div>
  );
}
