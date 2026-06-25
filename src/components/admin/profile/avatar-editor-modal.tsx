"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageUp, Minus, Plus, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  clampCropState,
  EDITOR_VIEWPORT,
  imageLayout,
  INITIAL_CROP_STATE,
  loadImageFromFile,
  MAX_ZOOM,
  MIN_ZOOM,
  renderCroppedFile,
  ZOOM_STEP,
  type CropState,
} from "@/lib/image-crop";

type AvatarEditorModalProps = {
  file: File;
  onApply: (cropped: File) => void;
  onCancel: () => void;
  onChoosePhoto: () => void;
  onError?: (message: string) => void;
  busy?: boolean;
};

function CropPreview({
  src,
  size,
  natW,
  natH,
  state,
}: {
  src: string;
  size: number;
  natW: number;
  natH: number;
  state: CropState;
}) {
  const layout = imageLayout(size, natW, natH, state);
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-border bg-muted"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute max-w-none select-none"
        style={{ width: layout.width, height: layout.height, left: layout.left, top: layout.top }}
      />
    </div>
  );
}

export function AvatarEditorModal({
  file,
  onApply,
  onCancel,
  onChoosePhoto,
  onError,
  busy = false,
}: AvatarEditorModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [state, setState] = useState<CropState>(INITIAL_CROP_STATE);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [viewportSize, setViewportSize] = useState(EDITOR_VIEWPORT);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    from: CropState;
  } | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    setObjectUrl(null);
    setDims(null);
    setLoadError(null);
    setState(INITIAL_CROP_STATE);

    loadImageFromFile(file)
      .then(({ image, objectUrl: url }) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        imageRef.current = image;
        revoked = url;
        setObjectUrl(url);
        setDims({ w: image.naturalWidth, h: image.naturalHeight });
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not read image.");
      });

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [file]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setViewportSize(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const ready = Boolean(objectUrl && dims);

  const applyState = useCallback(
    (next: CropState) => {
      if (!dims) return;
      setState(clampCropState(next, dims.w, dims.h));
    },
    [dims],
  );

  const nudgeZoom = useCallback(
    (delta: number) => applyState({ ...state, zoom: state.zoom + delta }),
    [applyState, state],
  );

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!ready || busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, from: state };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const rect = viewportRef.current?.getBoundingClientRect();
    const scale = rect ? EDITOR_VIEWPORT / rect.width : 1;
    applyState({
      ...drag.from,
      offsetX: drag.from.offsetX + (e.clientX - drag.startX) * scale,
      offsetY: drag.from.offsetY + (e.clientY - drag.startY) * scale,
    });
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || !ready) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      setState((prev) =>
        dims
          ? clampCropState({ ...prev, zoom: prev.zoom + dir * ZOOM_STEP }, dims.w, dims.h)
          : prev,
      );
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [ready, dims]);

  async function handleApply() {
    if (!imageRef.current || !dims || rendering || busy) return;
    setRendering(true);
    try {
      const cropped = await renderCroppedFile(imageRef.current, state, file.type);
      onApply(cropped);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not process the image.");
    } finally {
      setRendering(false);
    }
  }

  const editorLayout = dims ? imageLayout(viewportSize, dims.w, dims.h, state) : null;
  const working = busy || rendering;
  const isDefault = state.zoom === 1 && state.offsetX === 0 && state.offsetY === 0;

  return (
    <Modal
      aria-label="Edit profile picture"
      title="Edit profile picture"
      description="Drag to reposition and zoom to frame your photo."
      onClose={busy ? () => {} : onCancel}
      maxWidth="max-w-lg"
      className="max-h-[90vh] overflow-y-auto"
    >
      {loadError ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <button
            type="button"
            onClick={onChoosePhoto}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold transition-colors hover:bg-muted"
          >
            <ImageUp className="size-3.5" aria-hidden />
            Choose another photo
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex w-full max-w-[16rem] flex-col items-center gap-3">
              <div
                ref={viewportRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={cn(
                  "relative aspect-square w-full touch-none overflow-hidden rounded-full border border-border bg-muted",
                  ready ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                  working && "pointer-events-none opacity-70",
                )}
              >
                {objectUrl && editorLayout ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={objectUrl}
                      alt="Photo being cropped"
                      draggable={false}
                      className="pointer-events-none absolute max-w-none select-none"
                      style={{
                        width: editorLayout.width,
                        height: editorLayout.height,
                        left: editorLayout.left,
                        top: editorLayout.top,
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/40" />
                  </>
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Spinner className="size-6 text-primary" />
                  </div>
                )}
              </div>

              <div className="flex w-full items-center gap-2">
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => nudgeZoom(-ZOOM_STEP * 2)}
                  disabled={!ready || working || state.zoom <= MIN_ZOOM}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <Minus className="size-3.5" aria-hidden />
                </button>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={state.zoom}
                  disabled={!ready || working}
                  onChange={(e) => applyState({ ...state, zoom: Number(e.target.value) })}
                  aria-label="Zoom"
                  className="h-1.5 flex-1 cursor-pointer accent-primary disabled:opacity-40"
                />
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => nudgeZoom(ZOOM_STEP * 2)}
                  disabled={!ready || working || state.zoom >= MAX_ZOOM}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>

            {ready && objectUrl && dims ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs font-medium text-muted-foreground">Preview</p>
                <div className="flex items-end gap-3">
                  <CropPreview src={objectUrl} size={72} natW={dims.w} natH={dims.h} state={state} />
                  <CropPreview src={objectUrl} size={40} natW={dims.w} natH={dims.h} state={state} />
                  <CropPreview src={objectUrl} size={28} natW={dims.w} natH={dims.h} state={state} />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyState(INITIAL_CROP_STATE)}
                    disabled={working || isDefault}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <RotateCcw className="size-3" aria-hidden />
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={onChoosePhoto}
                    disabled={working}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <ImageUp className="size-3" aria-hidden />
                    Replace
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!ready || working}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working ? <Spinner className="size-4 text-primary-foreground" /> : null}
              {busy ? "Saving…" : "Save photo"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
