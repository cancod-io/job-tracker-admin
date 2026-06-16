"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { SCAM_URL_REASONS } from "@/components/admin/scam-urls/constants";
import { validateScamUrlInput } from "@/lib/scam-url-validation";
import type {
  ScamUrl,
  ScamUrlCreateRequest,
  ScamUrlType,
  ScamUrlUpdatePatch,
} from "@/types/scam-url-api";

type Mode = "create" | "edit";

type AdminScamUrlFormModalProps = {
  mode: Mode;
  initial?: ScamUrl | null;
  onClose: () => void;
  onSubmit: (payload: ScamUrlCreateRequest | ScamUrlUpdatePatch) => Promise<void>;
};

export function AdminScamUrlFormModal({
  mode,
  initial,
  onClose,
  onSubmit,
}: AdminScamUrlFormModalProps) {
  const [urlType, setUrlType] = useState<ScamUrlType>(initial?.url_type ?? "domain");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [reason, setReason] = useState(initial?.reason ?? SCAM_URL_REASONS[0]);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setUrlType(initial?.url_type ?? "domain");
    setUrl(initial?.url ?? "");
    setReason(initial?.reason ?? SCAM_URL_REASONS[0]);
    setNotes(initial?.notes ?? "");
    setUrlError(null);
    setSubmitError(null);
  }, [initial]);

  function validateForm(): boolean {
    const error = validateScamUrlInput(url, urlType);
    setUrlError(error);
    if (!reason.trim()) {
      setSubmitError("Reason is required.");
      return false;
    }
    return !error;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const trimmedUrl = url.trim();
      const trimmedNotes = notes.trim();

      if (mode === "create") {
        const payload: ScamUrlCreateRequest = {
          url: trimmedUrl,
          url_type: urlType,
          reason: reason.trim(),
          notes: trimmedNotes || null,
        };
        await onSubmit(payload);
      } else {
        const payload: ScamUrlUpdatePatch = {
          url: trimmedUrl,
          url_type: urlType,
          reason: reason.trim(),
          notes: trimmedNotes || null,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save scam URL.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      aria-label={mode === "create" ? "Add scam URL" : "Edit scam URL"}
      title={mode === "create" ? "Add Scam URL" : "Edit Scam URL"}
      description={
        mode === "create"
          ? "Block a domain or URL so jobs from it are removed and never added again."
          : `Update scam URL record for ${initial?.url ?? ""}.`
      }
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Type</legend>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="url-type"
                value="domain"
                checked={urlType === "domain"}
                onChange={() => {
                  setUrlType("domain");
                  setUrlError(null);
                }}
                className="size-4 accent-primary"
              />
              Domain
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="url-type"
                value="url"
                checked={urlType === "url"}
                onChange={() => {
                  setUrlType("url");
                  setUrlError(null);
                }}
                className="size-4 accent-primary"
              />
              URL
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            {urlType === "domain"
              ? "Blocks the domain and all subdomains (e.g. badjobs.com)."
              : "Blocks the exact URL path and child paths (e.g. https://site.com/jobs)."}
          </p>
        </fieldset>

        <div className="space-y-1">
          <label htmlFor="scam-url-input" className="text-sm font-medium text-foreground">
            URL / Domain
          </label>
          <input
            id="scam-url-input"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) setUrlError(null);
            }}
            autoFocus
            className="w-full rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={urlType === "domain" ? "badjobs.com" : "https://site.com/jobs"}
            aria-invalid={urlError != null}
            aria-describedby={urlError ? "scam-url-error" : undefined}
          />
          {urlError ? (
            <p id="scam-url-error" className="text-xs text-destructive" role="alert">
              {urlError}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="scam-reason-select" className="text-sm font-medium text-foreground">
            Reason
          </label>
          <select
            id="scam-reason-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground"
          >
            {SCAM_URL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="scam-notes-input" className="text-sm font-medium text-foreground">
            Notes <span className="font-normal text-muted-foreground">(Optional)</span>
          </label>
          <textarea
            id="scam-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Additional context for other admins…"
          />
        </div>

        {submitError ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : null}
            {mode === "create" ? "Save" : "Update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
