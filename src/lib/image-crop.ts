/**
 * Dependency-free helpers for a Slack-style circular avatar editor:
 * geometry for positioning an image inside a square crop viewport (zoom +
 * pan) and a canvas renderer that bakes the visible crop into a Blob.
 *
 * Offsets in {@link CropState} are expressed in **editor-viewport pixels**
 * ({@link EDITOR_VIEWPORT}) so the same state can drive previews of any size
 * and the final canvas render — every dimension scales linearly with the
 * viewport size.
 */

/** Logical size (px) of the editor crop viewport. All offsets are in these units. */
export const EDITOR_VIEWPORT = 256;
/**
 * Upper bound (px) on the square output. The render keeps the cropped region's
 * native pixels up to this cap, so a large source stays crisp instead of being
 * forced down to a small fixed size; only genuinely huge crops are scaled down.
 */
export const MAX_OUTPUT_SIZE = 1024;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.05;

export type CropState = {
  /** 1 = image fully "covers" the viewport, up to {@link MAX_ZOOM}. */
  zoom: number;
  /** Horizontal pan from centre, in editor-viewport pixels. */
  offsetX: number;
  /** Vertical pan from centre, in editor-viewport pixels. */
  offsetY: number;
};

export type ImageLayout = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export const INITIAL_CROP_STATE: CropState = { zoom: 1, offsetX: 0, offsetY: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Scale that makes the image just cover a square viewport (the `object-fit: cover` factor). */
function coverScale(viewport: number, natW: number, natH: number): number {
  if (natW <= 0 || natH <= 0) return 1;
  return Math.max(viewport / natW, viewport / natH);
}

/**
 * Clamp pan so the image always fully covers the viewport (no empty gaps),
 * and keep zoom within bounds. Offsets are interpreted in editor-viewport units.
 */
export function clampCropState(state: CropState, natW: number, natH: number): CropState {
  const zoom = clamp(state.zoom, MIN_ZOOM, MAX_ZOOM);
  const scale = coverScale(EDITOR_VIEWPORT, natW, natH) * zoom;
  const maxX = Math.max(0, (natW * scale - EDITOR_VIEWPORT) / 2);
  const maxY = Math.max(0, (natH * scale - EDITOR_VIEWPORT) / 2);
  return {
    zoom,
    offsetX: clamp(state.offsetX, -maxX, maxX),
    offsetY: clamp(state.offsetY, -maxY, maxY),
  };
}

/**
 * Absolute layout (in CSS px) for the `<img>` inside a square viewport of
 * `viewport` px. Drives both the live editor/preview DOM and the output canvas.
 */
export function imageLayout(
  viewport: number,
  natW: number,
  natH: number,
  state: CropState,
): ImageLayout {
  const k = viewport / EDITOR_VIEWPORT;
  const scale = coverScale(viewport, natW, natH) * state.zoom;
  const width = natW * scale;
  const height = natH * scale;
  return {
    width,
    height,
    left: (viewport - width) / 2 + state.offsetX * k,
    top: (viewport - height) / 2 + state.offsetY * k,
  };
}

/** Decode a File into an HTMLImageElement plus its object URL (caller revokes the URL). */
export function loadImageFromFile(
  file: File,
): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("That image could not be read. Try a different file."));
    };
    image.src = objectUrl;
  });
}

/** JPEG flattens transparency to black, so keep formats with an alpha channel as PNG. */
function outputMimeFor(sourceType: string): "image/png" | "image/jpeg" {
  return /png|webp|gif/i.test(sourceType) ? "image/png" : "image/jpeg";
}

/** Build a server-ready File name for the cropped output. */
function outputFileName(mime: string): string {
  return mime === "image/png" ? "avatar.png" : "avatar.jpg";
}

/**
 * Edge length (px) of the square output. The crop shows `min(natW, natH) / zoom`
 * source pixels per side, so render at exactly that many — preserving the
 * original resolution — capped at {@link MAX_OUTPUT_SIZE}.
 */
function outputSizeFor(natW: number, natH: number, zoom: number): number {
  const sourceSide = Math.min(natW, natH) / Math.max(zoom, MIN_ZOOM);
  return Math.max(1, Math.min(MAX_OUTPUT_SIZE, Math.round(sourceSide)));
}

/**
 * Downscale a source image to `targetW × targetH` by halving in steps. The
 * browser's single-shot `drawImage` blurs when shrinking by more than ~2×;
 * repeated halving stays sharp. Returns the image unchanged when no (or only
 * mild) downscaling is needed.
 */
function downscaleToCanvas(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
): CanvasImageSource {
  let curW = srcW;
  let curH = srcH;
  let current = source;

  while (curW > targetW * 2 && curH > targetH * 2) {
    const nextW = Math.max(targetW, Math.round(curW / 2));
    const nextH = Math.max(targetH, Math.round(curH / 2));
    const step = document.createElement("canvas");
    step.width = nextW;
    step.height = nextH;
    const stepCtx = step.getContext("2d");
    if (!stepCtx) break;
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = "high";
    stepCtx.drawImage(current, 0, 0, curW, curH, 0, 0, nextW, nextH);
    current = step;
    curW = nextW;
    curH = nextH;
  }
  return current;
}

/**
 * Bake the currently-visible crop into a square File at the source's native
 * resolution (capped at {@link MAX_OUTPUT_SIZE}), matching exactly what the
 * editor viewport shows.
 */
export async function renderCroppedFile(
  image: HTMLImageElement,
  state: CropState,
  sourceType: string,
): Promise<File> {
  const natW = image.naturalWidth;
  const natH = image.naturalHeight;
  const clamped = clampCropState(state, natW, natH);
  const size = outputSizeFor(natW, natH, clamped.zoom);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image editing is not supported in this browser.");

  const mime = outputMimeFor(sourceType);
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const { left, top, width, height } = imageLayout(size, natW, natH, clamped);
  const prepared = downscaleToCanvas(image, natW, natH, Math.round(width), Math.round(height));
  ctx.drawImage(prepared, left, top, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.95));
  if (!blob) throw new Error("Could not process the image. Try a different file.");
  return new File([blob], outputFileName(mime), { type: mime });
}
