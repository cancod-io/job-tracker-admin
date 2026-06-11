"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type {
  Company,
  CompanyCreateRequest,
  CompanyUpdatePatch,
} from "@/types/company-api";

type Mode = "create" | "edit";

type AdminCompanyFormModalProps = {
  mode: Mode;
  initial?: Company | null;
  onClose: () => void;
  onSubmit: (payload: CompanyCreateRequest | CompanyUpdatePatch) => Promise<void>;
};

type FormValues = {
  name: string;
  website_url: string;
  career_page_url_id: string;
  scraping_method_id: string;
  api_endpoint: string;
  is_active: boolean;
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

function parseOptionalId(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function toFormValues(initial?: Company | null): FormValues {
  return {
    name: initial?.name ?? "",
    website_url: initial?.website_url ?? "",
    career_page_url_id:
      initial?.career_page_url_id != null ? String(initial.career_page_url_id) : "",
    scraping_method_id:
      initial?.scraping_method_id != null ? String(initial.scraping_method_id) : "",
    api_endpoint: initial?.api_endpoint ?? "",
    is_active: initial?.is_active ?? true,
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

  const careerId = values.career_page_url_id.trim();
  if (careerId && parseOptionalId(careerId) == null) {
    errors.career_page_url_id = "Enter a positive integer ID or leave blank.";
  }

  const methodId = values.scraping_method_id.trim();
  if (methodId && parseOptionalId(methodId) == null) {
    errors.scraping_method_id = "Enter a positive integer ID or leave blank.";
  }

  const endpoint = values.api_endpoint.trim();
  if (endpoint && !isHttpUrl(endpoint)) {
    errors.api_endpoint = "Enter a valid http(s) URL or leave blank.";
  }

  return errors;
}

function toCreatePayload(values: FormValues): CompanyCreateRequest {
  return {
    name: values.name.trim(),
    website_url: values.website_url.trim() || null,
    career_page_url_id: parseOptionalId(values.career_page_url_id),
    scraping_method_id: parseOptionalId(values.scraping_method_id),
    api_endpoint: values.api_endpoint.trim() || null,
    is_active: values.is_active,
  };
}

function toUpdatePayload(values: FormValues): CompanyUpdatePatch {
  return {
    name: values.name.trim() || null,
    website_url: values.website_url.trim() || null,
    career_page_url_id: parseOptionalId(values.career_page_url_id),
    scraping_method_id: parseOptionalId(values.scraping_method_id),
    api_endpoint: values.api_endpoint.trim() || null,
    is_active: values.is_active,
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

        <div className="space-y-1">
          <label htmlFor="company-career-id" className="text-sm font-medium text-foreground">
          Career page Endpoint
          </label>
          <input
            id="company-career-id"
            value={values.career_page_url_id}
            onChange={(e) => setField("career_page_url_id", e.target.value)}
            className={inputClass("career_page_url_id")}
            placeholder="1"
            inputMode="numeric"
          />
          {/* {initial?.career_page_url ? (
            <p className="text-xs text-muted-foreground">
              Resolved URL: {initial.career_page_url}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              FK to the career page URL lookup table. Leave blank if unknown.
            </p>
          )} */}
          {showFieldError("career_page_url_id") ? (
            <p className="text-xs text-destructive">{showFieldError("career_page_url_id")}</p>
          ) : null}
        </div>
{/* 
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="company-method-id" className="text-sm font-medium text-foreground">
              Scraping method ID
            </label>
            <input
              id="company-method-id"
              value={values.scraping_method_id}
              onChange={(e) => setField("scraping_method_id", e.target.value)}
              className={inputClass("scraping_method_id")}
              placeholder="1"
              inputMode="numeric"
            />
            {initial?.scraping_method ? (
              <p className="text-xs text-muted-foreground">
                Resolved method: {initial.scraping_method}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                FK to the scraping method lookup table.
              </p>
            )}
            {showFieldError("scraping_method_id") ? (
              <p className="text-xs text-destructive">{showFieldError("scraping_method_id")}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <label htmlFor="company-endpoint" className="text-sm font-medium text-foreground">
              API endpoint
            </label>
            <input
              id="company-endpoint"
              value={values.api_endpoint}
              onChange={(e) => setField("api_endpoint", e.target.value)}
              className={inputClass("api_endpoint")}
              placeholder="https://api.example.com/jobs"
              inputMode="url"
            />
            {showFieldError("api_endpoint") ? (
              <p className="text-xs text-destructive">{showFieldError("api_endpoint")}</p>
            ) : null}
          </div>
        </div> */}

        {/* <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={values.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
            className="rounded border-border"
          />
          Active
          <span className="text-xs text-muted-foreground">(scraper runs against this company)</span>
        </label> */}

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
