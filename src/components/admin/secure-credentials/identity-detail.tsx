"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  ACCOUNT_SLOT_LABELS,
  ACCOUNT_SLOT_TYPES,
  formatCredentialType,
  credentialTypeBadgeClass,
} from "@/components/admin/secure-credentials/constants";
import { countryFlagEmoji, countryName } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type {
  CredentialTreeIdentityNode,
  CredentialType,
  SecureCredential,
} from "@/types/secure-credentials";

type IdentityDetailProps = {
  identity: CredentialTreeIdentityNode;
  onEditIdentity: () => void;
  onDeleteIdentity: () => void;
  onAddSlot: (slot: CredentialType) => void;
  onEditCredential: (row: SecureCredential) => void;
  onDeleteCredential: (row: SecureCredential) => void;
};

function slotForType(
  identity: CredentialTreeIdentityNode,
  type: CredentialType,
): SecureCredential | undefined {
  return identity.items.find((i) => i.credential_type === type);
}

export function IdentityDetail({
  identity,
  onEditIdentity,
  onDeleteIdentity,
  onAddSlot,
  onEditCredential,
  onDeleteCredential,
}: IdentityDetailProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="text-2xl leading-none" aria-hidden>
              {countryFlagEmoji(identity.country_code)}
            </span>
            {identity.display_name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {identity.country_code ? countryName(identity.country_code) : "No country set"}
            {identity.notes?.trim() ? ` · ${identity.notes}` : null}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEditIdentity}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            onClick={onDeleteIdentity}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ACCOUNT_SLOT_TYPES.map((slot) => {
          const row = slotForType(identity, slot);
          const label = ACCOUNT_SLOT_LABELS[slot] ?? slot;
          if (!row) {
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onAddSlot(slot)}
                className="flex min-h-[7.5rem] flex-col items-start justify-between rounded-xl border border-dashed border-border bg-muted/20 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Not added yet</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <Plus className="size-3.5" aria-hidden />
                  Add {label}
                </span>
              </button>
            );
          }
          return (
            <div
              key={slot}
              className="flex min-h-[7.5rem] flex-col justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                      credentialTypeBadgeClass(row.credential_type),
                    )}
                  >
                    {formatCredentialType(row.credential_type)}
                  </span>
                  {row.has_qr_image ? (
                    <span className="text-[11px] font-medium text-muted-foreground">QR saved</span>
                  ) : null}
                </div>
                <p className="truncate text-sm font-medium">
                  {row.username?.trim() || row.service_name}
                </p>
                {row.notes?.trim() ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{row.notes}</p>
                ) : null}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onEditCredential(row)}
                  className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs font-medium hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCredential(row)}
                  className="inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
