"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
import type { ApiKeyListItem } from "@/types/api-config-api";

type AdminApiKeyDeleteConfirmProps = {
  apiKey: ApiKeyListItem;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminApiKeyDeleteConfirm({
  apiKey,
  onClose,
  onConfirm,
}: AdminApiKeyDeleteConfirmProps) {
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
      aria-label="Delete API key confirmation"
      title="Delete API key"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-7" aria-hidden />
        </div>
        <p className="text-sm text-foreground">
          Delete the stored key for{" "}
          <span className="font-semibold">{apiKey.source_label}</span> (
          <span className="font-mono">{apiKey.masked_key}</span>)?
        </p>
        {apiKey.is_active ? (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            This key is currently active for {apiKey.source_label}. If other keys exist for this
            source, the newest remaining key will become active automatically.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
        )}
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
