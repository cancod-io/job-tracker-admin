"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
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

      <ConfirmDialogFooter
        error={error}
        busy={busy}
        onClose={onClose}
        onConfirm={() => void handleConfirm()}
      />
    </Modal>
  );
}
