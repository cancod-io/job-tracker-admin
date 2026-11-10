"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Fingerprint, Loader2, Plus, Trash2 } from "lucide-react";
import { ProfileSectionCard } from "@/components/admin/profile/profile-section-card";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
import { Modal } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/format-date";
import { isAdminRole } from "@/lib/admin-permissions";
import {
  deleteWebAuthnCredential,
  enrollWebAuthnPasskey,
  listWebAuthnCredentials,
} from "@/lib/webauthn-api";
import { useAuth } from "@/providers/auth-provider";
import type { WebAuthnCredential } from "@/types/webauthn";

type PasskeysSectionProps = {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

export function PasskeysSection({ onSuccess, onError }: PasskeysSectionProps) {
  const { accessToken, user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const [items, setItems] = useState<WebAuthnCredential[]>([]);
  const [passkeyRequired, setPasskeyRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deleting, setDeleting] = useState<WebAuthnCredential | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !isAdmin) {
      setItems([]);
      setPasskeyRequired(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listWebAuthnCredentials(accessToken);
      setItems(data.items);
      setPasskeyRequired(data.passkey_required);
    } catch (e) {
      setItems([]);
      setLoadError(e instanceof Error ? e.message : "Could not load passkeys.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleEnroll() {
    if (!accessToken) return;
    setEnrolling(true);
    try {
      await enrollWebAuthnPasskey(accessToken, deviceName.trim() || undefined);
      setDeviceName("");
      onSuccess?.("Passkey enrolled.");
      await load();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not enroll passkey.");
    } finally {
      setEnrolling(false);
    }
  }

  async function handleDelete() {
    if (!accessToken || !deleting) return;
    await deleteWebAuthnCredential(accessToken, deleting.id);
    onSuccess?.("Passkey deleted.");
    setDeleting(null);
    await load();
  }

  if (!isAdmin) {
    return (
      <ProfileSectionCard
        id="passkeys"
        title="Passkeys"
        description="Hardware-backed sign-in for the administrator account."
      >
        <p className="text-sm text-muted-foreground">
          Only the admin account can enroll and manage passkeys.
        </p>
      </ProfileSectionCard>
    );
  }

  return (
    <>
      <ProfileSectionCard
        id="passkeys"
        title="Passkeys"
        description="After you enroll at least one passkey, password-only sign-in requires completing a passkey challenge."
        action={
          <button
            type="button"
            onClick={() => void handleEnroll()}
            disabled={enrolling || loading || !accessToken}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enrolling ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            {enrolling ? "Waiting for authenticator…" : "Add passkey"}
          </button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="passkey-device-name" className="text-sm font-medium text-foreground">
              Device label <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="passkey-device-name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              maxLength={120}
              placeholder="e.g. MacBook Touch ID"
              disabled={enrolling}
              className="form-control w-full max-w-md"
            />
          </div>

          {passkeyRequired ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
              Password-only login is blocked for this admin until a passkey ceremony completes.
            </p>
          ) : null}

          {loadError ? <AlertBanner>{loadError}</AlertBanner> : null}

          {loading && items.length === 0 ? (
            <div
              className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
              aria-busy="true"
            >
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              Loading passkeys…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Fingerprint className="size-5" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">No passkeys enrolled</p>
              <p className="text-xs text-muted-foreground">
                Add a passkey using Windows Hello, Touch ID, or a security key. Use this site at
                https://147.93.180.179:8443 — localhost will not work with the production RP ID.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/80 overflow-hidden rounded-xl border border-border">
              {items.map((cred) => (
                <li
                  key={cred.id}
                  className="flex flex-col gap-3 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {cred.device_name?.trim() || "Unnamed passkey"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hint <span className="font-mono">{cred.credential_id_hint}</span>
                      {" · "}Added {formatDateTime(cred.created_at)}
                      {cred.last_used_at ? ` · Last used ${formatDateTime(cred.last_used_at)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleting(cred)}
                    className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 sm:self-auto"
                    aria-label={`Delete passkey ${cred.device_name || cred.credential_id_hint}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ProfileSectionCard>

      {deleting ? (
        <PasskeyDeleteConfirm
          credential={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </>
  );
}

function PasskeyDeleteConfirm({
  credential,
  onClose,
  onConfirm,
}: {
  credential: WebAuthnCredential;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = credential.device_name?.trim() || credential.credential_id_hint;

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal aria-label="Delete passkey confirmation" title="Delete passkey" onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-7" aria-hidden />
        </div>
        <p className="text-sm text-foreground">
          Delete passkey <span className="break-all font-semibold">&apos;{label}&apos;</span>?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          You will no longer be able to sign in with this authenticator. If it is your last passkey,
          password-only login may be allowed again.
        </p>
      </div>
      <ConfirmDialogFooter
        error={error}
        busy={busy}
        onClose={onClose}
        onConfirm={() => void handleConfirm()}
        centered
      />
    </Modal>
  );
}

/** @deprecated Prefer PasskeysSection — kept as alias for older imports. */
export const TwoFactorSection = PasskeysSection;
