/**
 * Browser client for admin WebAuthn / passkeys (`/api/v1/auth/webauthn/*`).
 *
 * Registration endpoints require an admin Bearer token.
 * Login options/verify are public.
 */
import {
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { apiUrl } from "@/lib/api";
import { API_PATHS } from "@/lib/api-paths";
import {
  apiErrorCode,
  apiErrorMessage,
  createLoginAuthError,
  type ApiAuthErrorShape,
} from "@/lib/auth-errors";
import { fetchAuthedJson } from "@/lib/fetch-authed";
import { fetchWithTimeout } from "@/lib/http";
import type { TokenResponse } from "@/types/auth";
import type {
  WebAuthnCredential,
  WebAuthnCredentialListResponse,
  WebAuthnOptionsResponse,
} from "@/types/webauthn";

const PATHS = API_PATHS.auth.webauthn;

export const WEBAUTHN_ERROR_CODES = {
  PASSKEY_REQUIRED: "PASSKEY_REQUIRED",
  PASSKEY_NOT_AVAILABLE: "PASSKEY_NOT_AVAILABLE",
  WEBAUTHN_NOT_CONFIGURED: "WEBAUTHN_NOT_CONFIGURED",
  WEBAUTHN_CHALLENGE_INVALID: "WEBAUTHN_CHALLENGE_INVALID",
  WEBAUTHN_REGISTRATION_FAILED: "WEBAUTHN_REGISTRATION_FAILED",
  WEBAUTHN_ASSERTION_FAILED: "WEBAUTHN_ASSERTION_FAILED",
} as const;

const WEBAUTHN_MESSAGES: Record<string, string> = {
  [WEBAUTHN_ERROR_CODES.PASSKEY_REQUIRED]:
    "A passkey is required for this admin account. Complete the passkey prompt to continue.",
  [WEBAUTHN_ERROR_CODES.PASSKEY_NOT_AVAILABLE]:
    "No passkey is available for this email. Sign in with password, or enroll a passkey as admin first.",
  [WEBAUTHN_ERROR_CODES.WEBAUTHN_NOT_CONFIGURED]:
    "Passkeys are not configured on the server. Contact an administrator.",
  [WEBAUTHN_ERROR_CODES.WEBAUTHN_CHALLENGE_INVALID]:
    "The passkey challenge expired or is invalid. Please try again.",
  [WEBAUTHN_ERROR_CODES.WEBAUTHN_REGISTRATION_FAILED]:
    "Could not enroll this passkey. Try again or use a different authenticator.",
  [WEBAUTHN_ERROR_CODES.WEBAUTHN_ASSERTION_FAILED]:
    "Passkey verification failed. Try again or use another enrolled device.",
};

export function messageForWebAuthnCode(code: string | null | undefined, fallback: string): string {
  if (!code) return fallback;
  return WEBAUTHN_MESSAGES[code] ?? fallback;
}

export function isPasskeyRequiredCode(code: string | null | undefined): boolean {
  return code === WEBAUTHN_ERROR_CODES.PASSKEY_REQUIRED;
}

function normalizeCredential(raw: Partial<WebAuthnCredential> & { id: number }): WebAuthnCredential {
  return {
    id: raw.id,
    device_name: typeof raw.device_name === "string" ? raw.device_name : null,
    transports: typeof raw.transports === "string" ? raw.transports : null,
    created_at:
      typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    last_used_at: typeof raw.last_used_at === "string" ? raw.last_used_at : null,
    credential_id_hint:
      typeof raw.credential_id_hint === "string" ? raw.credential_id_hint : "—",
  };
}

function isRawCredential(value: unknown): value is Partial<WebAuthnCredential> & { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

async function readPublicError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => ({}))) as ApiAuthErrorShape;
  const code = apiErrorCode(body);
  const message = messageForWebAuthnCode(code, apiErrorMessage(body) ?? fallback);
  return createLoginAuthError({ message, code, fields: [] });
}

function browserCancelMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  const name = err.name;
  if (name === "NotAllowedError" || name === "AbortError") {
    return "Passkey prompt was cancelled or timed out.";
  }
  if (name === "InvalidStateError") {
    return "This authenticator is already registered. Try another device or remove the existing passkey.";
  }
  if (name === "NotSupportedError") {
    return "This browser or device does not support passkeys.";
  }
  if (name === "SecurityError") {
    return "Passkeys require HTTPS on the configured origin (https://147.93.180.179:8443).";
  }
  return null;
}

/** Public: begin passkey login ceremony for an email. */
export async function fetchWebAuthnLoginOptions(email: string): Promise<WebAuthnOptionsResponse> {
  const res = await fetchWithTimeout(apiUrl(PATHS.loginOptions), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: email.trim() }),
    credentials: "omit",
  });
  if (!res.ok) {
    throw await readPublicError(res, "Could not start passkey sign-in.");
  }
  return (await res.json()) as WebAuthnOptionsResponse;
}

/** Public: finish passkey login → same TokenResponse as password login. */
export async function verifyWebAuthnLogin(
  sessionId: string,
  credential: AuthenticationResponseJSON,
): Promise<TokenResponse> {
  const res = await fetchWithTimeout(apiUrl(PATHS.loginVerify), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ session_id: sessionId, credential }),
    credentials: "omit",
  });
  if (!res.ok) {
    throw await readPublicError(res, "Passkey sign-in failed.");
  }
  return (await res.json()) as TokenResponse;
}

/**
 * Full browser passkey login: options → authenticator → verify.
 * Returns TokenResponse (caller applies tokens / loads profile).
 */
export async function completeWebAuthnLogin(email: string): Promise<TokenResponse> {
  const { session_id, options } = await fetchWebAuthnLoginOptions(email);
  let assertion: AuthenticationResponseJSON;
  try {
    assertion = await startAuthentication({
      optionsJSON: options as PublicKeyCredentialRequestOptionsJSON,
    });
  } catch (err) {
    const cancelled = browserCancelMessage(err);
    if (cancelled) throw createLoginAuthError({ message: cancelled, code: null, fields: [] });
    throw err;
  }
  return verifyWebAuthnLogin(session_id, assertion);
}

export async function listWebAuthnCredentials(
  token: string,
): Promise<WebAuthnCredentialListResponse> {
  try {
    const raw = await fetchAuthedJson<{
      items?: unknown;
      passkey_required?: unknown;
    }>(token, PATHS.credentials);
    const items = Array.isArray(raw.items)
      ? (raw.items as unknown[]).filter(isRawCredential).map(normalizeCredential)
      : [];
    return { items, passkey_required: raw.passkey_required === true };
  } catch (err) {
    throw enrichWebAuthnThrownError(err, "Could not load passkeys.");
  }
}

export async function beginWebAuthnRegistration(token: string): Promise<WebAuthnOptionsResponse> {
  try {
    return await fetchAuthedJson<WebAuthnOptionsResponse>(token, PATHS.registerOptions, {
      method: "POST",
      body: {},
    });
  } catch (err) {
    throw enrichWebAuthnThrownError(err, "Could not start passkey enrollment.");
  }
}

export async function verifyWebAuthnRegistration(
  token: string,
  body: {
    session_id: string;
    credential: RegistrationResponseJSON;
    device_name?: string | null;
  },
): Promise<WebAuthnCredential> {
  const transports = body.credential.response?.transports ?? undefined;
  try {
    const raw = await fetchAuthedJson<Partial<WebAuthnCredential> & { id: number }>(
      token,
      PATHS.registerVerify,
      {
        method: "POST",
        body: {
          session_id: body.session_id,
          credential: body.credential,
          device_name: body.device_name?.trim() || null,
          transports: transports?.length ? transports : null,
        },
      },
    );
    return normalizeCredential(raw);
  } catch (err) {
    throw enrichWebAuthnThrownError(err, "Could not save passkey.");
  }
}

/** Full enrollment: options → authenticator → verify. */
export async function enrollWebAuthnPasskey(
  token: string,
  deviceName?: string,
): Promise<WebAuthnCredential> {
  const { session_id, options } = await beginWebAuthnRegistration(token);
  let attestation: RegistrationResponseJSON;
  try {
    attestation = await startRegistration({
      optionsJSON: options as PublicKeyCredentialCreationOptionsJSON,
    });
  } catch (err) {
    const cancelled = browserCancelMessage(err);
    if (cancelled) throw new Error(cancelled);
    throw err;
  }
  return verifyWebAuthnRegistration(token, {
    session_id,
    credential: attestation,
    device_name: deviceName,
  });
}

export async function deleteWebAuthnCredential(
  token: string,
  credentialId: number,
): Promise<void> {
  try {
    await fetchAuthedJson<void>(token, PATHS.credentialDelete(credentialId), {
      method: "DELETE",
    });
  } catch (err) {
    throw enrichWebAuthnThrownError(err, "Could not delete passkey.");
  }
}

/**
 * fetchAuthedJson only surfaces the message string. Re-map known WebAuthn phrases
 * when the backend embeds the code in the message, and keep a typed code when present.
 */
function enrichWebAuthnThrownError(err: unknown, fallback: string): Error {
  if (!(err instanceof Error)) return new Error(fallback);
  const msg = err.message;
  for (const code of Object.values(WEBAUTHN_ERROR_CODES)) {
    if (msg.includes(code) || msg.toLowerCase().includes(code.toLowerCase().replace(/_/g, " "))) {
      return createLoginAuthError({
        message: messageForWebAuthnCode(code, msg),
        code,
        fields: [],
      });
    }
  }
  if (/not configured/i.test(msg)) {
    return createLoginAuthError({
      message: messageForWebAuthnCode(WEBAUTHN_ERROR_CODES.WEBAUTHN_NOT_CONFIGURED, msg),
      code: WEBAUTHN_ERROR_CODES.WEBAUTHN_NOT_CONFIGURED,
      fields: [],
    });
  }
  if (/challenge/i.test(msg) && /invalid|expired/i.test(msg)) {
    return createLoginAuthError({
      message: messageForWebAuthnCode(WEBAUTHN_ERROR_CODES.WEBAUTHN_CHALLENGE_INVALID, msg),
      code: WEBAUTHN_ERROR_CODES.WEBAUTHN_CHALLENGE_INVALID,
      fields: [],
    });
  }
  return err;
}
