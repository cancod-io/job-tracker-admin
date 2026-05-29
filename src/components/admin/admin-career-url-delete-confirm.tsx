"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { CareerUrl } from "@/types/career-url-api";

type AdminCareerUrlDeleteConfirmProps = {
  careerUrl: CareerUrl;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminCareerUrlDeleteConfirm({
  careerUrl,
  onClose,
  onConfirm,
}: AdminCareerUrlDeleteConfirmProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      aria-label="Delete career URL confirmation"
      title="Delete career URL?"
      description="This action cannot be undone."
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <p className="text-sm text-foreground">
        Are you sure you want to delete career URL record{" "}
        <span className="font-semibold">#{careerUrl.id}</span>?
      </p>
      <p className="mt-2 break-all text-sm text-muted-foreground">{careerUrl.career_url}</p>

      {error ? (
        <p
          className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : null}
          Delete
        </button>
      </div>
    </Modal>
  );
}
