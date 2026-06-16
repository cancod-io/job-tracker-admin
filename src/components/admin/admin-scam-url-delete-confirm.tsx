"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
import type { ScamUrl } from "@/types/scam-url-api";

type AdminScamUrlDeleteConfirmProps = {
  scamUrl: ScamUrl;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminScamUrlDeleteConfirm({
  scamUrl,
  onClose,
  onConfirm,
}: AdminScamUrlDeleteConfirmProps) {
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
      aria-label="Delete scam URL confirmation"
      title="Delete Scam URL"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-7" aria-hidden />
        </div>
        <p className="text-sm text-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold break-all">&apos;{scamUrl.url}&apos;</span>?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
      </div>

      <ConfirmDialogFooter
        error={error}
        busy={busy}
        onClose={onClose}
        onConfirm={() => void handleConfirm()}
        centered
      />
    </Modal>
  );
}
