"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type {
  Company,
  CompanyScrapingMethod,
  CompanyWritePayload,
} from "@/types/company-api";

type Mode = "create" | "edit";

type AdminCompanyFormModalProps = {
  mode: Mode;
  initial?: Company | null;
  onClose: () => void;
  onSubmit: (payload: CompanyWritePayload) => Promise<void>;
};

type FieldErrors = Partial<Record<keyof CompanyWritePayload, string>>;

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validate(payload: CompanyWritePayload): FieldErrors {
  const errors: FieldErrors = {};
  if (!payload.name.trim()) errors.name = "Name is required.";
  if (!payload.website_url.trim()) {
    errors.website_url = "Website URL is required.";
  } else if (!isHttpUrl(payload.website_url.trim())) {
    errors.website_url = "Enter a valid http(s) URL.";
  }
  if (!payload.career_page_url.trim()) {
    errors.career_page_url = "Career page URL is required.";
  } else if (!isHttpUrl(payload.career_page_url.trim())) {
    errors.career_page_url = "Enter a valid http(s) URL.";
  }
  if (payload.scraping_method === "api") {
    const ep = (payload.api_endpoint ?? "").trim();
    if (!ep) {
      errors.api_endpoint = "API endpoint is required when method is API.";
    } else if (!isHttpUrl(ep)) {
      errors.api_endpoint = "Enter a valid http(s) URL.";
    }
  }
  return errors;
}

export function AdminCompanyFormModal({
  mode,
  initial,
  onClose,
  onSubmit,
}: AdminCompanyFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial?.website_url ?? "");
  const [careerPageUrl, setCareerPageUrl] = useState(initial?.career_page_url ?? "");
  const [scrapingMethod, setScrapingMethod] = useState<CompanyScrapingMethod>(
    initial?.scraping_method ?? "static",
  );
  const [apiEndpoint, setApiEndpoint] = useState(initial?.api_endpoint ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const payload = useMemo<CompanyWritePayload>(
    () => ({
      name: name.trim(),
      website_url: websiteUrl.trim(),
      career_page_url: careerPageUrl.trim(),
      scraping_method: scrapingMethod,
      api_endpoint: scrapingMethod === "api" ? apiEndpoint.trim() || null : null,
      is_active: isActive,
    }),
    [name, websiteUrl, careerPageUrl, scrapingMethod, apiEndpoint, isActive],
  );

  const errors = useMemo(() => validate(payload), [payload]);
  const hasErrors = Object.keys(errors).length > 0;

  // Clear stale API-endpoint error when switching back to Static.
  useEffect(() => {
    if (scrapingMethod === "static") setSubmitError(null);
  }, [scrapingMethod]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setSubmitError(null);
    if (hasErrors) return;

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save company.");
    } finally {
      setSubmitting(false);
    }
  }

  const showFieldError = (key: keyof CompanyWritePayload): string | undefined =>
    submitted ? errors[key] : undefined;

  const inputClass = (key: keyof CompanyWritePayload) =>
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className={inputClass("name")}
            placeholder="Acme Corp"
          />
          {showFieldError("name") ? (
            <p className="text-xs text-destructive">{showFieldError("name")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="company-website" className="text-sm font-medium text-foreground">
            Website URL <span className="text-destructive">*</span>
          </label>
          <input
            id="company-website"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className={inputClass("website_url")}
            placeholder="https://acme.com"
            inputMode="url"
          />
          {showFieldError("website_url") ? (
            <p className="text-xs text-destructive">{showFieldError("website_url")}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="company-careers" className="text-sm font-medium text-foreground">
            Career Page URL <span className="text-destructive">*</span>
          </label>
          <input
            id="company-careers"
            value={careerPageUrl}
            onChange={(e) => setCareerPageUrl(e.target.value)}
            className={inputClass("career_page_url")}
            placeholder="https://careers.acme.com"
            inputMode="url"
          />
          {showFieldError("career_page_url") ? (
            <p className="text-xs text-destructive">{showFieldError("career_page_url")}</p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="company-method" className="text-sm font-medium text-foreground">
              Scraping Method <span className="text-destructive">*</span>
            </label>
            <select
              id="company-method"
              value={scrapingMethod}
              onChange={(e) => setScrapingMethod(e.target.value as CompanyScrapingMethod)}
              className="w-full rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="static">Static</option>
              <option value="api">API</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="company-endpoint" className="text-sm font-medium text-foreground">
              API Endpoint
              {scrapingMethod === "api" ? (
                <span className="text-destructive"> *</span>
              ) : (
                <span className="ml-1 text-xs font-normal text-muted-foreground">(API only)</span>
              )}
            </label>
            <input
              id="company-endpoint"
              value={apiEndpoint ?? ""}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className={cn(
                inputClass("api_endpoint"),
                scrapingMethod === "static" && "bg-muted text-muted-foreground",
              )}
              disabled={scrapingMethod === "static"}
              placeholder="https://api.example.com/jobs"
              inputMode="url"
            />
            {showFieldError("api_endpoint") ? (
              <p className="text-xs text-destructive">{showFieldError("api_endpoint")}</p>
            ) : null}
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-border"
          />
          Active
          <span className="text-xs text-muted-foreground">(scraper runs against this company)</span>
        </label>

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
