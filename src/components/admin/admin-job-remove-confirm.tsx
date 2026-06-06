"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
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

      {error ? (
        <p
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="min-w-[7rem] rounded-lg border border-border/80 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy}
          className="inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : null}
          Yes, Remove
        </button>
      </div>
    </Modal>
  );
}
