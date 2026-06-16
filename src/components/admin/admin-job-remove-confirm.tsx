"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
import type { AdminJobDetail } from "@/types/admin-job-api";

type AdminJobRemoveConfirmProps = {
  job: AdminJobDetail;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminJobRemoveConfirm({ job, onClose, onConfirm }: AdminJobRemoveConfirmProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove the job.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      aria-label="Remove job confirmation"
      title="Remove Job"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
          <AlertTriangle className="size-7" aria-hidden />
        </span>
        <p className="mt-4 text-sm text-foreground">
          Are you sure you want to remove <span className="font-semibold">{job.job_title}</span> at{" "}
          <span className="font-semibold">{job.company}</span>? This action cannot be undone.
        </p>
      </div>

      <ConfirmDialogFooter
        error={error}
        busy={busy}
        onClose={onClose}
        onConfirm={() => void handleConfirm()}
        confirmLabel="Yes, Remove"
        centered
      />
    </Modal>
  );
}
