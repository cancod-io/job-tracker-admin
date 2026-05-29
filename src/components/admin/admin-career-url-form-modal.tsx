"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
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

const MAX_URL_LENGTH = 2083;

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validateCareerUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Career URL is required.";
  if (trimmed.length > MAX_URL_LENGTH) {
    return `Career URL must be ${MAX_URL_LENGTH} characters or fewer.`;
  }
  if (!isHttpUrl(trimmed)) return "Enter a valid http(s) URL.";
  return undefined;
}

export function AdminCareerUrlFormModal({
  mode,
  initial,
  onClose,
  onSubmit,
}: AdminCareerUrlFormModalProps) {
  const [careerUrl, setCareerUrl] = useState(initial?.career_url ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setCareerUrl(initial?.career_url ?? "");
  }, [initial]);

  const fieldError = useMemo(() => validateCareerUrl(careerUrl), [careerUrl]);
  const showError = submitted ? fieldError : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setSubmitError(null);
    if (fieldError) return;

    setSubmitting(true);
    try {
      const trimmed = careerUrl.trim();
      const payload =
        mode === "create"
          ? ({ career_url: trimmed } satisfies CareerUrlCreateRequest)
          : ({ career_url: trimmed } satisfies CareerUrlUpdatePatch);
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
            Career URL <span className="text-destructive">*</span>
          </label>
          <input
            id="career-url-input"
            value={careerUrl}
            onChange={(e) => setCareerUrl(e.target.value)}
            autoFocus
            maxLength={MAX_URL_LENGTH}
            className={cn(
              "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              showError ? "border-destructive/60" : "border-border/80",
            )}
            placeholder="https://jobs.example.com/"
            inputMode="url"
          />
          {showError ? <p className="text-xs text-destructive">{showError}</p> : null}
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
