/**
 * Browser client for admin face soft-MFA (`/api/v1/auth/face/*`).
 */
import { apiUrl } from "@/lib/api";
import { API_PATHS } from "@/lib/api-paths";
import { createLoginAuthError, resolveLoginError, type ApiAuthErrorShape } from "@/lib/auth-errors";
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { fetchWithTimeout } from "@/lib/http";
import type { TokenResponse } from "@/types/auth";
import type { FaceDescriptor, FaceEnrollRequest, FaceStatusResponse } from "@/types/face-auth";
import { FACE_DESCRIPTOR_LENGTH } from "@/types/face-auth";

const PATHS = API_PATHS.auth.face;

function assertDescriptor(descriptor: FaceDescriptor): void {
  if (!Array.isArray(descriptor) || descriptor.length !== FACE_DESCRIPTOR_LENGTH) {
    throw createLoginAuthError({
      message: `Face descriptor must contain exactly ${FACE_DESCRIPTOR_LENGTH} numbers.`,
      code: "FACE_DESCRIPTOR_INVALID",
      fields: [],
      faceSessionId: null,
    });
  }
}

async function readPublicError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => ({}))) as ApiAuthErrorShape;
  return createLoginAuthError(resolveLoginError(body, fallback));
}

export async function getFaceStatus(token: string): Promise<FaceStatusResponse> {
  const raw = await fetchAuthedJson<Partial<FaceStatusResponse>>(token, PATHS.me);
  return {
    enrolled: raw.enrolled === true,
    label: typeof raw.label === "string" ? raw.label : null,
    enrolled_at: typeof raw.enrolled_at === "string" ? raw.enrolled_at : null,
    last_verified_at: typeof raw.last_verified_at === "string" ? raw.last_verified_at : null,
    face_required_on_login: raw.face_required_on_login === true,
  };
}

export async function enrollFace(
  token: string,
  descriptor: FaceDescriptor,
  label?: string | null,
): Promise<FaceStatusResponse> {
  assertDescriptor(descriptor);
  const body: FaceEnrollRequest = {
    descriptor,
    label: label?.trim() || null,
  };
  const raw = await fetchAuthedJson<Partial<FaceStatusResponse>>(token, PATHS.enroll, {
    method: "POST",
    body,
  });
  return {
    enrolled: raw.enrolled !== false,
    label: typeof raw.label === "string" ? raw.label : (body.label ?? null),
    enrolled_at: typeof raw.enrolled_at === "string" ? raw.enrolled_at : null,
    last_verified_at: typeof raw.last_verified_at === "string" ? raw.last_verified_at : null,
    face_required_on_login: raw.face_required_on_login !== false,
  };
}

export async function deleteFaceEnrollment(token: string): Promise<void> {
  await fetchAuthedJson<void>(token, PATHS.me, { method: "DELETE" });
}

/** Public: finish face login after FACE_REQUIRED → TokenResponse. */
export async function verifyFaceLogin(
  faceSessionId: string,
  descriptor: FaceDescriptor,
): Promise<TokenResponse> {
  assertDescriptor(descriptor);
  const res = await fetchWithTimeout(apiUrl(PATHS.loginVerify), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      face_session_id: faceSessionId,
      descriptor,
    }),
    credentials: "omit",
  });
  if (!res.ok) {
    throw await readPublicError(res, "Face verification failed.");
  }
  return (await res.json()) as TokenResponse;
}
