"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { CREDENTIAL_TYPE_OPTIONS } from "@/components/admin/secure-credentials/constants";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Modal } from "@/components/ui/modal";
import type {
  CredentialType,
  SecureCredential,
  SecureCredentialCreateRequest,
  SecureCredentialUpdateRequest,
} from "@/types/secure-credentials";

type Mode = "create" | "edit";

type SecureCredentialsFormDialogProps = {
  mode: Mode;
  initial?: SecureCredential | null;
  onClose: () => void;
  onSubmit: (
    payload: SecureCredentialCreateRequest | SecureCredentialUpdateRequest,
  ) => Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

function SecretInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  autoComplete = "new-password",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Hide whenever the typed value is cleared (e.g. after successful submit).
    if (!value) setVisible(false);
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={visible ? "Hide secret" : "Show typed secret"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

export function SecureCredentialsFormDialog({
  mode,
  initial,
  onClose,
  onSubmit,
}: SecureCredentialsFormDialogProps) {
  const [serviceName, setServiceName] = useState(initial?.service_name ?? "");
  const [credentialType, setCredentialType] = useState<CredentialType>(
    initial?.credential_type ?? "other",
  );
  const [ownerUserId, setOwnerUserId] = useState("");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [secret, setSecret] = useState(initial?.secret ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [clearUsername, setClearUsername] = useState(false);
  const [clearNotes, setClearNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadedSecret, setLoadedSecret] = useState(initial?.secret ?? "");

  useEffect(() => {
    setServiceName(initial?.service_name ?? "");
    setCredentialType(initial?.credential_type ?? "other");
    setOwnerUserId("");
    setUsername(initial?.username ?? "");
    setSecret(initial?.secret ?? "");
    setLoadedSecret(initial?.secret ?? "");
    setNotes(initial?.notes ?? "");
    setClearUsername(false);
    setClearNotes(false);
    setSubmitError(null);
  }, [initial, mode]);

  function clearSecretFields() {
    setOwnerUserId("");
    setUsername("");
    setSecret("");
    setLoadedSecret("");
    setNotes("");
    setClearUsername(false);
    setClearNotes(false);
  }

  function validate(): string | null {
    const name = serviceName.trim();
    if (!name) return "Service name is required.";
    if (name.length > 200) return "Service name must be at most 200 characters.";
    if (username.length > 500) return "Username must be at most 500 characters.";
    if (notes.length > 4000) return "Notes must be at most 4000 characters.";
    if (mode === "create" && ownerUserId.trim()) {
      const parsed = Number(ownerUserId.trim());
      if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
        return "Owner user ID must be a positive integer.";
      }
    }
    if (mode === "create") {
      const trimmedSecret = secret.trim();
      if (!trimmedSecret) return "Secret is required.";
      if (trimmedSecret.length > 8000) return "Secret must be at most 8000 characters.";
    } else if (secret.trim().length > 8000) {
      return "Secret must be at most 8000 characters.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const payload: SecureCredentialCreateRequest = {
          service_name: serviceName.trim(),
          credential_type: credentialType,
          secret: secret.trim(),
        };
        const trimmedOwner = ownerUserId.trim();
        if (trimmedOwner) payload.owner_user_id = Number(trimmedOwner);
        const trimmedUsername = username.trim();
        if (trimmedUsername) payload.username = trimmedUsername;
        const trimmedNotes = notes.trim();
        if (trimmedNotes) payload.notes = trimmedNotes;
        await onSubmit(payload);
      } else {
        const payload: SecureCredentialUpdateRequest = {
          service_name: serviceName.trim(),
          credential_type: credentialType,
        };
        if (clearUsername) {
          payload.clear_username = true;
        } else {
          const trimmedUsername = username.trim();
          if (trimmedUsername) payload.username = trimmedUsername;
        }
        const trimmedSecret = secret.trim();
        if (trimmedSecret && trimmedSecret !== loadedSecret) {
          payload.secret = trimmedSecret;
        } else if (trimmedSecret && !loadedSecret) {
          payload.secret = trimmedSecret;
        }
        if (clearNotes) {
          payload.clear_notes = true;
        } else {
          const trimmedNotes = notes.trim();
          if (trimmedNotes) payload.notes = trimmedNotes;
        }
        await onSubmit(payload);
      }
      clearSecretFields();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save credential.");
    } finally {
      setSubmitting(false);
    }
  }

  const isCreate = mode === "create";

  return (
    <Modal
      aria-label={isCreate ? "Add credential" : "Edit credential"}
      title={isCreate ? "Add Credential" : "Edit Credential"}
      description={
        isCreate
          ? "Store a password or key securely. Secrets are write-only and never returned by the API."
          : `Update ${initial?.service_name ?? "credential"}. Leave secret blank to keep the existing value.`
      }
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" autoComplete="off" noValidate>
        <div className="space-y-1">
          <label htmlFor="credential-service-name" className="text-sm font-medium text-foreground">
            Service name <span className="text-destructive">*</span>
          </label>
          <input
            id="credential-service-name"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g. Shopify Admin Account"
            maxLength={200}
            required
            className={inputClass}
          />
        </div>

        {isCreate ? (
          <div className="space-y-1">
            <label htmlFor="credential-owner-user-id" className="text-sm font-medium text-foreground">
              Owner user ID
            </label>
            <input
              id="credential-owner-user-id"
              type="number"
              min={1}
              step={1}
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
              placeholder="Optional — defaults to you"
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to assign the credential to your own account.
            </p>
          </div>
        ) : initial ? (
          <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Owner
            </p>
            <p className="mt-0.5 text-foreground">
              {initial.owner_name?.trim() ||
                (initial.owner_user_id > 0 ? `User #${initial.owner_user_id}` : "—")}
            </p>
          </div>
        ) : null}

        <div className="space-y-1">
          <label htmlFor="credential-type" className="text-sm font-medium text-foreground">
            Type
          </label>
          <select
            id="credential-type"
            value={credentialType}
            onChange={(e) => setCredentialType(e.target.value as CredentialType)}
            className={inputClass}
          >
            {CREDENTIAL_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="credential-username" className="text-sm font-medium text-foreground">
            Username / Email
          </label>
          <input
            id="credential-username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (e.target.value) setClearUsername(false);
            }}
            placeholder="Optional"
            maxLength={500}
            disabled={!isCreate && clearUsername}
            autoComplete="off"
            className={inputClass}
          />
          {!isCreate && (initial?.has_username || Boolean(initial?.username?.trim())) ? (
            <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearUsername}
                onChange={(e) => {
                  setClearUsername(e.target.checked);
                  if (e.target.checked) setUsername("");
                }}
                className="size-3.5 accent-primary"
              />
              Clear stored username
            </label>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="credential-secret" className="text-sm font-medium text-foreground">
            Password / Secret {isCreate ? <span className="text-destructive">*</span> : null}
          </label>
          <SecretInput
            id="credential-secret"
            value={secret}
            onChange={setSecret}
            required={isCreate}
            placeholder={
              isCreate
                ? "Required"
                : initial?.has_secret && !secret
                  ? "Leave blank to keep existing, or type a new secret"
                  : "Enter secret"
            }
          />
          {!isCreate ? (
            <p className="text-xs text-muted-foreground">
              {secret
                ? "Use the eye icon to show or hide the secret. Leave unchanged to keep it."
                : "Leave blank to keep the existing secret, or type a new value to replace it."}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="credential-notes" className="text-sm font-medium text-foreground">
            Notes
          </label>
          <textarea
            id="credential-notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (e.target.value) setClearNotes(false);
            }}
            placeholder="Optional"
            maxLength={4000}
            rows={3}
            disabled={!isCreate && clearNotes}
            className={`${inputClass} resize-y`}
          />
          {!isCreate && (initial?.has_notes || Boolean(initial?.notes?.trim())) ? (
            <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearNotes}
                onChange={(e) => {
                  setClearNotes(e.target.checked);
                  if (e.target.checked) setNotes("");
                }}
                className="size-3.5 accent-primary"
              />
              Clear stored notes
            </label>
          ) : null}
        </div>

        {submitError ? <AlertBanner>{submitError}</AlertBanner> : null}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : null}
            {isCreate ? "Save Credential" : "Update Credential"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
