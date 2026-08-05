/**
 * Auth error codes and parsing for admin login (password, passkey, face).
 */

export type LoginField = "email" | "password";

export type ApiAuthErrorShape = {
  error?: {
    message?: string;
    code?: string;
    details?: LoginErrorDetails | unknown;
  };
  detail?: unknown;
};

export type LoginErrorDetails = {
  field?: LoginField;
  fields?: LoginField[];
  face_session_id?: string;
};

export const LOGIN_ERROR_CODES = {
  LOGIN_FIELDS_MISSING: "LOGIN_FIELDS_MISSING",
  INVALID_EMAIL: "INVALID_EMAIL",
  INCORRECT_PASSWORD: "INCORRECT_PASSWORD",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACCOUNT_REJECTED: "ACCOUNT_REJECTED",
  PASSKEY_REQUIRED: "PASSKEY_REQUIRED",
  PASSKEY_NOT_AVAILABLE: "PASSKEY_NOT_AVAILABLE",
  WEBAUTHN_NOT_CONFIGURED: "WEBAUTHN_NOT_CONFIGURED",
  WEBAUTHN_CHALLENGE_INVALID: "WEBAUTHN_CHALLENGE_INVALID",
  WEBAUTHN_REGISTRATION_FAILED: "WEBAUTHN_REGISTRATION_FAILED",
  WEBAUTHN_ASSERTION_FAILED: "WEBAUTHN_ASSERTION_FAILED",
  FACE_REQUIRED: "FACE_REQUIRED",
  FACE_NOT_MATCHED: "FACE_NOT_MATCHED",
  FACE_SESSION_INVALID: "FACE_SESSION_INVALID",
  FACE_DESCRIPTOR_INVALID: "FACE_DESCRIPTOR_INVALID",
  FACE_DISABLED: "FACE_DISABLED",
  IP_NOT_ALLOWED: "IP_NOT_ALLOWED",
} as const;

export type ResolvedLoginError = {
  message: string;
  code: string | null;
  fields: LoginField[];
  /** Present when code is FACE_REQUIRED — continue with face verify. */
  faceSessionId: string | null;
};

export type LoginAuthError = Error & {
  code?: string | null;
  fields?: LoginField[];
  faceSessionId?: string | null;
};

export function apiErrorMessage(data: ApiAuthErrorShape): string | null {
  const msg = data.error?.message;
  return typeof msg === "string" && msg.length > 0 ? msg : null;
}

export function apiErrorCode(data: ApiAuthErrorShape): string | null {
  const c = data.error?.code;
  return typeof c === "string" && c.length > 0 ? c : null;
}

function parseLoginErrorDetails(details: unknown): LoginErrorDetails {
  if (!details || typeof details !== "object") return {};
  const d = details as Record<string, unknown>;
  const field = d.field === "email" || d.field === "password" ? (d.field as LoginField) : undefined;
  const fields = Array.isArray(d.fields)
    ? d.fields.filter((f): f is LoginField => f === "email" || f === "password")
    : undefined;
  const face_session_id =
    typeof d.face_session_id === "string" && d.face_session_id.trim()
      ? d.face_session_id.trim()
      : undefined;
  return { field, fields, face_session_id };
}

function fieldsFromCodeAndDetails(code: string | null, details: LoginErrorDetails): LoginField[] {
  const out: LoginField[] = [];
  if (details.field) out.push(details.field);
  if (details.fields?.length) out.push(...details.fields);
  const unique = [...new Set(out)];
  if (unique.length > 0) return unique;

  switch (code) {
    case LOGIN_ERROR_CODES.INVALID_EMAIL:
      return ["email"];
    case LOGIN_ERROR_CODES.INCORRECT_PASSWORD:
      return ["password"];
    case LOGIN_ERROR_CODES.LOGIN_FIELDS_MISSING:
      return ["email", "password"];
    default:
      return [];
  }
}

const FORM_LEVEL_CODES = new Set<string>([
  LOGIN_ERROR_CODES.PENDING_APPROVAL,
  LOGIN_ERROR_CODES.ACCOUNT_REJECTED,
  LOGIN_ERROR_CODES.PASSKEY_REQUIRED,
  LOGIN_ERROR_CODES.PASSKEY_NOT_AVAILABLE,
  LOGIN_ERROR_CODES.WEBAUTHN_NOT_CONFIGURED,
  LOGIN_ERROR_CODES.WEBAUTHN_CHALLENGE_INVALID,
  LOGIN_ERROR_CODES.WEBAUTHN_REGISTRATION_FAILED,
  LOGIN_ERROR_CODES.WEBAUTHN_ASSERTION_FAILED,
  LOGIN_ERROR_CODES.FACE_REQUIRED,
  LOGIN_ERROR_CODES.FACE_NOT_MATCHED,
  LOGIN_ERROR_CODES.FACE_SESSION_INVALID,
  LOGIN_ERROR_CODES.FACE_DESCRIPTOR_INVALID,
  LOGIN_ERROR_CODES.FACE_DISABLED,
  LOGIN_ERROR_CODES.IP_NOT_ALLOWED,
]);

const FACE_MESSAGES: Record<string, string> = {
  [LOGIN_ERROR_CODES.FACE_REQUIRED]:
    "Face verification is required for this admin account.",
  [LOGIN_ERROR_CODES.FACE_NOT_MATCHED]:
    "Face did not match. Position your face in the frame and try again.",
  [LOGIN_ERROR_CODES.FACE_SESSION_INVALID]:
    "Face verification session expired. Please sign in again.",
  [LOGIN_ERROR_CODES.FACE_DESCRIPTOR_INVALID]:
    "Invalid face descriptor. Please try capturing again.",
  [LOGIN_ERROR_CODES.FACE_DISABLED]:
    "Face recognition is disabled on the server.",
  [LOGIN_ERROR_CODES.IP_NOT_ALLOWED]:
    "Sign-in is not allowed from this IP address.",
};

export function messageForFaceCode(code: string | null | undefined, fallback: string): string {
  if (!code) return fallback;
  return FACE_MESSAGES[code] ?? fallback;
}

export function isFaceRequiredCode(code: string | null | undefined): boolean {
  return code === LOGIN_ERROR_CODES.FACE_REQUIRED;
}

export function resolveLoginError(
  data: ApiAuthErrorShape,
  fallback = "Sign-in failed",
): ResolvedLoginError {
  const code = apiErrorCode(data);
  const details = parseLoginErrorDetails(data.error?.details);
  const rawMessage =
    apiErrorMessage(data) ?? (typeof data.detail === "string" ? data.detail : fallback);
  const message = messageForFaceCode(code, rawMessage);
  const formLevel = code != null && FORM_LEVEL_CODES.has(code);
  const fields = formLevel ? [] : fieldsFromCodeAndDetails(code, details);
  const faceSessionId =
    code === LOGIN_ERROR_CODES.FACE_REQUIRED
      ? (details.face_session_id ?? null)
      : (details.face_session_id ?? null);
  return {
    message,
    code,
    fields,
    faceSessionId:
      code === LOGIN_ERROR_CODES.FACE_REQUIRED ? faceSessionId : null,
  };
}

export function createLoginAuthError(
  resolved: Omit<ResolvedLoginError, "faceSessionId"> & {
    faceSessionId?: string | null;
  },
): LoginAuthError {
  const err = new Error(resolved.message) as LoginAuthError;
  err.code = resolved.code;
  err.fields = resolved.fields;
  err.faceSessionId = resolved.faceSessionId ?? null;
  return err;
}

export function isLoginAuthError(err: unknown): err is LoginAuthError {
  return err instanceof Error && ("code" in err || "fields" in err);
}

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

export class SessionExpiredError extends Error {
  override readonly name = "SessionExpiredError";

  constructor(message = SESSION_EXPIRED_MESSAGE) {
    super(message);
  }
}

export function createSessionExpiredError(): SessionExpiredError {
  return new SessionExpiredError();
}

export function isSessionExpiredError(err: unknown): err is SessionExpiredError {
  return err instanceof SessionExpiredError;
}
