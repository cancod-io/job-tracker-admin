"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
import { Modal } from "@/components/ui/modal";

type EmployerDeleteConfirmProps = {
  employerName: string;
  credentialCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function EmployerDeleteConfirm({
  employerName,
  credentialCount,
  onClose,
  onConfirm,
}: EmployerDeleteConfirmProps) {
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
      aria-label="Delete employer confirmation"
      title="Delete employer folder"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-7" aria-hidden />
        </div>
        <p className="text-sm text-foreground">
          Delete <span className="break-all font-semibold">&apos;{employerName}&apos;</span>?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {credentialCount > 0
            ? `This folder still has ${credentialCount} credential${credentialCount === 1 ? "" : "s"}. Move or delete them first — the server will block this until it is empty.`
            : "This removes the empty employer folder. It cannot be undone."}
        </p>
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
