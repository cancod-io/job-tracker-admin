"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Modal } from "@/components/ui/modal";
import type {
  CredentialEmployer,
  CredentialEmployerCreateRequest,
  CredentialEmployerUpdateRequest,
} from "@/types/secure-credentials";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

type EmployerFormDialogProps = {
  mode: "create" | "edit";
  initial?: CredentialEmployer | null;
  onClose: () => void;
  onSubmit: (
    payload: CredentialEmployerCreateRequest | CredentialEmployerUpdateRequest,
  ) => Promise<void>;
};

export function EmployerFormDialog({
  mode,
  initial,
  onClose,
  onSubmit,
}: EmployerFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial?.website_url ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial?.name ?? "");
    setWebsiteUrl(initial?.website_url ?? "");
    setNotes(initial?.notes ?? "");
    setError(null);
  }, [initial, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Employer name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        const payload: CredentialEmployerCreateRequest = { name: trimmed };
        if (websiteUrl.trim()) payload.website_url = websiteUrl.trim();
        if (notes.trim()) payload.notes = notes.trim();
        await onSubmit(payload);
      } else {
        const payload: CredentialEmployerUpdateRequest = { name: trimmed };
        if (websiteUrl.trim()) payload.website_url = websiteUrl.trim();
        else payload.clear_website_url = true;
        if (notes.trim()) payload.notes = notes.trim();
        else payload.clear_notes = true;
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save employer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      aria-label={mode === "create" ? "Add employer" : "Edit employer"}
      title={mode === "create" ? "Add employer folder" : "Edit employer"}
      description="Job credentials sit under an employer (e.g. Acme Corp, Greenhouse portal)."
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="employer-name" className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            id="employer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            maxLength={200}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="employer-website" className="text-sm font-medium">
            Website
          </label>
          <input
            id="employer-website"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://careers.example.com"
            maxLength={500}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="employer-notes" className="text-sm font-medium">
            Notes
          </label>
          <textarea
            id="employer-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Optional"
            className={`${inputClass} resize-y`}
          />
        </div>
        {error ? <AlertBanner>{error}</AlertBanner> : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {mode === "create" ? "Add employer" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
