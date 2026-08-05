/**
 * Browser helpers for @vladmandic/face-api (128-d face descriptors).
 * Models load from jsDelivr CDN; only call from the browser.
 * Loaded via dynamic import so Next does not pull face-api into the server bundle.
 */
import type { FaceDescriptor } from "@/types/face-auth";
import { FACE_DESCRIPTOR_LENGTH } from "@/types/face-auth";

const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";

/** Minimal surface we use from @vladmandic/face-api (avoids `typeof import()` lint). */
type FaceApiModule = {
  nets: {
    tinyFaceDetector: { loadFromUri: (uri: string) => Promise<unknown> };
    faceLandmark68Net: { loadFromUri: (uri: string) => Promise<unknown> };
    faceRecognitionNet: { loadFromUri: (uri: string) => Promise<unknown> };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TinyFaceDetectorOptions: new (opts?: { inputSize?: number; scoreThreshold?: number }) => any;
  // Chainable face-api tasks are thenables; keep loose for typing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detectSingleFace: (input: HTMLVideoElement, options?: unknown) => any;
};

let faceapiPromise: Promise<FaceApiModule> | null = null;
let modelsLoaded = false;
let modelsLoadPromise: Promise<void> | null = null;

async function getFaceApi(): Promise<FaceApiModule> {
  if (!faceapiPromise) {
    faceapiPromise = import(
      /* webpackChunkName: "face-api" */
      "@vladmandic/face-api"
    ).then((mod) => mod as unknown as FaceApiModule);
  }
  return faceapiPromise;
}

/** Load tinyFaceDetector + landmarks + recognition nets (idempotent). */
export async function ensureFaceModelsLoaded(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Face recognition only runs in the browser.");
  }
  if (modelsLoaded) return;
  if (modelsLoadPromise) return modelsLoadPromise;

  modelsLoadPromise = (async () => {
    const faceapi = await getFaceApi();
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  try {
    await modelsLoadPromise;
  } catch (err) {
    modelsLoadPromise = null;
    throw err instanceof Error
      ? err
      : new Error("Could not load face recognition models.");
  }
}

export function isValidFaceDescriptor(value: unknown): value is FaceDescriptor {
  if (!Array.isArray(value) || value.length !== FACE_DESCRIPTOR_LENGTH) return false;
  return value.every((n) => typeof n === "number" && Number.isFinite(n));
}

/**
 * Detect a single face in a video frame and return a 128-float descriptor.
 * Throws a user-facing Error when no face is found or models are unavailable.
 */
export async function captureFaceDescriptor(
  video: HTMLVideoElement,
): Promise<FaceDescriptor> {
  await ensureFaceModelsLoaded();
  const faceapi = await getFaceApi();

  if (video.readyState < 2 || video.videoWidth === 0) {
    throw new Error("Camera is not ready yet. Wait a moment and try again.");
  }

  const detection = await faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }),
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error("No face detected. Center your face in the frame and try again.");
  }

  const descriptor = Array.from(detection.descriptor);
  if (!isValidFaceDescriptor(descriptor)) {
    throw new Error("Could not compute a valid face descriptor. Try again.");
  }
  return descriptor;
}

/** Open the user-facing webcam stream. Caller must stop tracks when done. */
export async function openUserCamera(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support camera access.");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error("Camera permission denied. Allow camera access and try again.");
      }
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        throw new Error("No camera found on this device.");
      }
      if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        throw new Error("Camera is in use by another application.");
      }
      if (err.name === "SecurityError") {
        throw new Error("Camera requires a secure context (HTTPS or localhost).");
      }
    }
    throw err instanceof Error ? err : new Error("Could not open the camera.");
  }
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
