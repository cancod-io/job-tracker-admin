"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type {
  CareerUrl,
  CareerUrlCreateRequest,
  CareerUrlUpdatePatch,
} from "@/types/career-url-api";

type Mode = "create" | "edit";

type AdminCareerUrlFormModalProps = {
  mode: Mode;
  initial?: CareerUrl | null;
  onClose: () => void;
  onSubmit: (payload: CareerUrlCreateRequest | CareerUrlUpdatePatch) => Promise<void>;
};

export function AdminCareerUrlFormModal({
  mode,
  initial,
  onClose,
  onSubmit,
}: AdminCareerUrlFormModalProps) {
  const [careerUrl, setCareerUrl] = useState(initial?.career_url ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setCareerUrl(initial?.career_url ?? "");
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload =
        mode === "create"
          ? ({ career_url: careerUrl } satisfies CareerUrlCreateRequest)
          : ({ career_url: careerUrl } satisfies CareerUrlUpdatePatch);
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save career URL.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      aria-label={mode === "create" ? "Create career URL" : "Edit career URL"}
      title={mode === "create" ? "Add career URL" : "Edit career URL"}
      description={
        mode === "create"
          ? "Add a subdomain or career page URL the scraper should poll for job listings."
          : `Update the career URL for record #${initial?.id ?? ""}.`
      }
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="career-url-input" className="text-sm font-medium text-foreground">
            Career URL
          </label>
          <input
            id="career-url-input"
            value={careerUrl}
            onChange={(e) => setCareerUrl(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="https://jobs.example.com/"
          />
          <p className="text-xs text-muted-foreground">
            Full URL to the company careers or jobs listing page. No company link is required yet.
          </p>
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
            {mode === "create" ? "Create career URL" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
