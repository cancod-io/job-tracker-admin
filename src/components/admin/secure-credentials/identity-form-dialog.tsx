"use client";

import { useEffect, useState } from "react";
import { CountrySelect } from "@/components/ui/country-select";
import { Modal } from "@/components/ui/modal";
import type {
  CredentialIdentity,
  CredentialIdentityCreateRequest,
  CredentialIdentityUpdateRequest,
} from "@/types/secure-credentials";

type Mode = "create" | "edit";

type IdentityFormDialogProps = {
  mode: Mode;
  initial?: CredentialIdentity | null;
  /** Required on create when managing another user's vault. */
  ownerUserId?: number | null;
  onClose: () => void;
  onSubmit: (
    payload: CredentialIdentityCreateRequest | CredentialIdentityUpdateRequest,
  ) => Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

export function IdentityFormDialog({
  mode,
  initial,
  ownerUserId = null,
  onClose,
  onSubmit,
}: IdentityFormDialogProps) {
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [countryCode, setCountryCode] = useState<string | null>(initial?.country_code ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [clearCountry, setClearCountry] = useState(false);
  const [clearNotes, setClearNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(initial?.display_name ?? "");
    setCountryCode(initial?.country_code ?? null);
    setNotes(initial?.notes ?? "");
    setClearCountry(false);
    setClearNotes(false);
    setError(null);
  }, [initial, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = displayName.trim();
    if (!name) {
      setError("Display name is required.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "create") {
        const payload: CredentialIdentityCreateRequest = { display_name: name };
        if (ownerUserId != null && ownerUserId > 0) payload.owner_user_id = ownerUserId;
        if (countryCode) payload.country_code = countryCode;
        if (notes.trim()) payload.notes = notes.trim();
        await onSubmit(payload);
      } else {
        const payload: CredentialIdentityUpdateRequest = { display_name: name };
        if (clearCountry) payload.clear_country_code = true;
        else if (countryCode) payload.country_code = countryCode;
        if (clearNotes) payload.clear_notes = true;
        else payload.notes = notes.trim() || null;
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save identity.");
    } finally {
      setSubmitting(false);
    }
  }

  const isCreate = mode === "create";

  return (
    <Modal
      aria-label={isCreate ? "Add identity" : "Edit identity"}
      title={isCreate ? "Add Identity" : "Edit Identity"}
      description="A named persona with an optional country flag. Account slots like Gmail and LinkedIn hang under this identity."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="identity-name" className="text-xs font-semibold">
            Display name <span className="text-rose-500">*</span>
          </label>
          <input
            id="identity-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Andrew Clarker"
            maxLength={200}
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold">Country / location</p>
          <CountrySelect
            value={clearCountry ? null : countryCode}
            onChange={(code) => {
              setCountryCode(code);
              setClearCountry(false);
            }}
            disabled={submitting}
          />
          {!isCreate && initial?.country_code ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearCountry}
                onChange={(e) => {
                  setClearCountry(e.target.checked);
                  if (e.target.checked) setCountryCode(null);
                }}
                className="size-3.5 accent-primary"
              />
              Clear country
            </label>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="identity-notes" className="text-xs font-semibold">
            Notes
          </label>
          <textarea
            id="identity-notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (e.target.value) setClearNotes(false);
            }}
            rows={2}
            maxLength={4000}
            disabled={!isCreate && clearNotes}
            placeholder="Optional"
            className={`${inputClass} resize-y`}
          />
          {!isCreate && Boolean(initial?.notes?.trim()) ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearNotes}
                onChange={(e) => {
                  setClearNotes(e.target.checked);
                  if (e.target.checked) setNotes("");
                }}
                className="size-3.5 accent-primary"
              />
              Clear notes
            </label>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? (
              <span
                className="inline-block size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden
              />
            ) : null}
            {isCreate ? "Save Identity" : "Update Identity"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
