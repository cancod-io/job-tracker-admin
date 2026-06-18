"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
import { formatDateTime } from "@/lib/format-date";
import type { ApiFetchRun } from "@/types/api-fetch-runs";

type AdminJobFetchRunDeleteConfirmProps = {
  run: ApiFetchRun;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminJobFetchRunDeleteConfirm({
  run,
  onClose,
  onConfirm,
}: AdminJobFetchRunDeleteConfirmProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete fetch run.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      aria-label="Delete fetch run confirmation"
      title="Delete Fetch Run"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
          <AlertTriangle className="size-7" aria-hidden />
        </span>
        <p className="mt-4 text-sm text-foreground">
          Delete ingest run <span className="font-semibold">#{run.id}</span> from{" "}
          <span className="font-semibold">{formatDateTime(run.started_at)}</span>?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This removes the run record and its diff data. Job listings themselves are not deleted.
        </p>
      </div>

      <ConfirmDialogFooter
        error={error}
        busy={busy}
        onClose={onClose}
        onConfirm={() => void handleConfirm()}
        confirmLabel="Yes, Delete"
        centered
      />
    </Modal>
  );
}
