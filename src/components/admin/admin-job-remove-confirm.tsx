"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
import type { AdminJobDetail } from "@/types/admin-job-api";

type AdminJobRemoveConfirmProps = {
  jobs: AdminJobDetail[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminJobRemoveConfirm({ jobs, onClose, onConfirm }: AdminJobRemoveConfirmProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = jobs.length;
  const single = count === 1 ? jobs[0] : null;

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
      title={count === 1 ? "Remove Job" : `Remove ${count} jobs?`}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
          <AlertTriangle className="size-7" aria-hidden />
        </span>
        {single ? (
          <p className="mt-4 text-sm text-foreground">
            Are you sure you want to remove <span className="font-semibold">{single.job_title}</span>{" "}
            at <span className="font-semibold">{single.company}</span>? This action cannot be
            undone.
          </p>
        ) : (
          <div className="mt-4 space-y-2 text-sm text-foreground">
            <p>
              Are you sure you want to remove{" "}
              <span className="font-semibold tabular-nums">{count}</span> jobs? This action cannot
              be undone.
            </p>
            <ul className="max-h-40 w-full space-y-1 overflow-y-auto rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-left text-xs">
              {jobs.map((job) => (
                <li key={job.id} className="truncate">
                  {job.job_title} · {job.company}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialogFooter
        error={error}
        busy={busy}
        onClose={onClose}
        onConfirm={() => void handleConfirm()}
        confirmLabel={count === 1 ? "Yes, Remove" : `Remove (${count})`}
        centered
      />
    </Modal>
  );
}
