/** WebAuthn / passkey DTOs for `/api/v1/auth/webauthn/*`. */

export type WebAuthnOptionsResponse = {
  session_id: string;
  /** PublicKeyCredentialCreationOptionsJSON or PublicKeyCredentialRequestOptionsJSON */
  options: Record<string, unknown>;
};

export type WebAuthnCredential = {
  id: number;
  device_name: string | null;
  transports: string | null;
  created_at: string;
  last_used_at: string | null;
  /** Short base64url prefix of the credential id for display only. */
  credential_id_hint: string;
};

export type WebAuthnCredentialListResponse = {
  items: WebAuthnCredential[];
  /** True when password-only login is blocked for this admin. */
  passkey_required: boolean;
};

export type WebAuthnRegisterVerifyBody = {
  session_id: string;
  credential: Record<string, unknown>;
  device_name?: string | null;
  transports?: string[] | null;
};

export type WebAuthnLoginVerifyBody = {
  session_id: string;
  credential: Record<string, unknown>;
};
