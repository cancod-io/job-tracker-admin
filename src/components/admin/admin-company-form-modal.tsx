"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { Company, CompanyFormPayload, CompanyFormUpdatePayload } from "@/types/company-api";

type Mode = "create" | "edit";

type AdminCompanyFormModalProps = {
  mode: Mode;
  initial?: Company | null;
  onClose: () => void;
  onSubmit: (payload: CompanyFormPayload | CompanyFormUpdatePayload) => Promise<void>;
};

type FormValues = {
  name: string;
  website_url: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
function toFormValues(initial?: Company | null): FormValues {
  return {
    name: initial?.name ?? "",
    website_url: initial?.website_url ?? "",
  };
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > 300) {
    errors.name = "Name must be 300 characters or fewer.";
  }

  const website = values.website_url.trim();
  if (website && !isHttpUrl(website)) {
    errors.website_url = "Enter a valid http(s) URL or leave blank.";
  }

  return errors;
}

function toCreatePayload(values: FormValues): CompanyFormPayload {
  return {
    name: values.name.trim(),
    website_url: values.website_url.trim() || null,
  };
}

function toUpdatePayload(values: FormValues): CompanyFormUpdatePayload {
  return {
    name: values.name.trim() || null,
    website_url: values.website_url.trim() || null,
  };
}

export function AdminCompanyFormModal({
  mode,
  initial,
  onClose,
  onSubmit,
}: AdminCompanyFormModalProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(initial));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setValues(toFormValues(initial));
  }, [initial]);

  const errors = useMemo(() => validate(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setSubmitError(null);
    if (hasErrors) return;

    setSubmitting(true);
    try {
      const payload = mode === "create" ? toCreatePayload(values) : toUpdatePayload(values);
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save company.");
    } finally {
      setSubmitting(false);
    }
  }

  const showFieldError = (key: keyof FormValues): string | undefined =>
    submitted ? errors[key] : undefined;

  const inputClass = (key: keyof FormValues) =>
    cn(
      "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      showFieldError(key) ? "border-destructive/60" : "border-border/80",
    );

  return (
    <Modal
      aria-label={mode === "create" ? "Create company" : "Edit company"}
      title={mode === "create" ? "Add company" : "Edit company"}
      description={
        mode === "create"
          ? "Register a new company so the scraper can collect its jobs."
          : `Update ${initial?.name ?? "this company"}.`
      }
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="company-name" className="text-sm font-medium text-foreground">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            id="company-name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            autoFocus
            maxLength={300}
            className={inputClass("name")}
            placeholder="Acme Corp"
          />
          {showFieldError("name") ? (
            <p className="text-xs text-destructive">{showFieldError("name")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="company-website" className="text-sm font-medium text-foreground">
            Website URL
          </label>
          <input
            id="company-website"
            value={values.website_url}
            onChange={(e) => setField("website_url", e.target.value)}
            className={inputClass("website_url")}
            placeholder="https://acme.com"
            inputMode="url"
          />
          {showFieldError("website_url") ? (
            <p className="text-xs text-destructive">{showFieldError("website_url")}</p>
          ) : null}
        </div>

        {/* <div className="space-y-1">
          <label htmlFor="company-career-url" className="text-sm font-medium text-foreground">
            Career Page URL
          </label>
          <input
            id="company-career-url"
            value={values.career_page_url}
            onChange={(e) => setField("career_page_url", e.target.value)}
            className={inputClass("career_page_url")}
            placeholder="https://acme.com/careers"
            inputMode="url"
          />
          <p className="text-xs text-muted-foreground">
            If this URL already exists in Career URLs, the company links to that record. Otherwise
            it is added automatically.
          </p>
          {showFieldError("career_page_url") ? (
            <p className="text-xs text-destructive">{showFieldError("career_page_url")}</p>
          ) : null}
        </div> */}

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
            {mode === "create" ? "Create company" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
