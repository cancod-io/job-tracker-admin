"use client";

import { useEffect, useState } from "react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Modal } from "@/components/ui/modal";
import type {
  WebsiteLink,
  WebsiteLinkCreateRequest,
  WebsiteLinkUpdateRequest,
} from "@/types/website-links";

type Mode = "create" | "edit";

type LinksFormDialogProps = {
  mode: Mode;
  initial?: WebsiteLink | null;
  onClose: () => void;
  onSubmit: (payload: WebsiteLinkCreateRequest | WebsiteLinkUpdateRequest) => Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

export function LinksFormDialog({ mode, initial, onClose, onSubmit }: LinksFormDialogProps) {
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [clearDescription, setClearDescription] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setUrl(initial?.url ?? "");
    setDescription(initial?.description ?? "");
    setClearDescription(false);
    setSubmitError(null);
  }, [initial, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setSubmitError("URL is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const payload: WebsiteLinkCreateRequest = { url: trimmedUrl };
        const trimmedDesc = description.trim();
        if (trimmedDesc) payload.description = trimmedDesc;
        await onSubmit(payload);
      } else {
        const payload: WebsiteLinkUpdateRequest = { url: trimmedUrl };
        if (clearDescription) {
          payload.clear_description = true;
        } else {
          payload.description = description.trim() || null;
        }
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save link.");
    } finally {
      setSubmitting(false);
    }
  }

  const isCreate = mode === "create";

  return (
    <Modal
      aria-label={isCreate ? "Add link" : "Edit link"}
      title={isCreate ? "Add Link" : "Edit Link"}
      description="Shared with every user and admin. Index is assigned automatically."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
        {!isCreate && initial ? (
          <p className="text-xs text-muted-foreground">
            Display index: <span className="font-mono font-semibold">#{initial.display_index}</span>
          </p>
        ) : null}

        <div className="space-y-1">
          <label htmlFor="link-url" className="text-sm font-medium">
            URL <span className="text-destructive">*</span>
          </label>
          <input
            id="link-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="link-description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="link-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (e.target.value) setClearDescription(false);
            }}
            rows={3}
            maxLength={4000}
            disabled={!isCreate && clearDescription}
            placeholder="Optional"
            className={`${inputClass} resize-y`}
          />
          {!isCreate && Boolean(initial?.description?.trim()) ? (
            <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearDescription}
                onChange={(e) => {
                  setClearDescription(e.target.checked);
                  if (e.target.checked) setDescription("");
                }}
                className="size-3.5 accent-primary"
              />
              Clear description
            </label>
          ) : null}
        </div>
        {submitError ? <AlertBanner>{submitError}</AlertBanner> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {isCreate ? "Save Link" : "Update Link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
