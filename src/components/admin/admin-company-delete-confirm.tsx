"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
import type { Company } from "@/types/company-api";

type AdminCompanyDeleteConfirmProps = {
  companies: Company[];
  /** When set, confirms deletion of all companies matching current list filters. */
  deleteAll?: { total: number; filtered: boolean };
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function AdminCompanyDeleteConfirm({
  companies,
  deleteAll,
  onClose,
  onConfirm,
}: AdminCompanyDeleteConfirmProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = deleteAll?.total ?? companies.length;
  const single = !deleteAll && count === 1 ? companies[0] : null;

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
      aria-label="Delete company confirmation"
      title={
        deleteAll
          ? `Delete all ${count} companies?`
          : count === 1
            ? "Delete company?"
            : `Delete ${count} companies?`
      }
      description="This action cannot be undone."
      onClose={onClose}
      maxWidth="max-w-md"
    >
      {deleteAll ? (
        <p className="text-sm text-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold tabular-nums">{count}</span>{" "}
          {count === 1 ? "company" : "companies"}
          {deleteAll.filtered ? " matching the current search and filters" : ""}? Jobs associated
          with them will keep their existing data but the scraper will stop polling them.
        </p>
      ) : single ? (
        <p className="text-sm text-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{single.name}</span>? Jobs associated with this company
          will keep their existing data but the scraper will stop polling it.
        </p>
      ) : (
        <div className="space-y-2 text-sm text-foreground">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold tabular-nums">{count}</span> companies? Jobs associated
            with them will keep their existing data but the scraper will stop polling them.
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs">
            {companies.map((c) => (
              <li key={c.id} className="truncate">
                {c.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialogFooter
        error={error}
        busy={busy}
        onClose={onClose}
        onConfirm={() => void handleConfirm()}
        confirmLabel={`Delete${count > 1 ? ` (${count})` : ""}`}
      />
    </Modal>
  );
}
