"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import {
  credentialTypeBadgeClass,
  formatCredentialType,
  isTwoFaCredentialType,
} from "@/components/admin/secure-credentials/constants";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { SecureCredential } from "@/types/secure-credentials";

export type BreadcrumbCrumb = {
  label: string;
  onClick?: () => void;
};

type SecureCredentialsTableProps = {
  items: SecureCredential[];
  loading: boolean;
  hasLoaded: boolean;
  showOwner?: boolean;
  showPath?: boolean;
  heading: string;
  subheading?: string;
  breadcrumb?: BreadcrumbCrumb[];
  emptyTitle: string;
  emptyDescription: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  dangerActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onDangerAction?: () => void;
  onEdit: (row: SecureCredential) => void;
  onDelete: (row: SecureCredential) => void;
};

function TypeBadge({ type }: { type: SecureCredential["credential_type"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        credentialTypeBadgeClass(type),
      )}
    >
      {isTwoFaCredentialType(type) ? <Shield className="size-3" aria-hidden /> : null}
      {formatCredentialType(type)}
    </span>
  );
}

function IconAction({
  label,
  onClick,
  tone = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        tone === "danger" &&
          "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400",
      )}
    >
      {children}
    </button>
  );
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title={copied ? "Copied" : `Copy ${label}`}
      aria-label={copied ? "Copied" : `Copy ${label}`}
      onClick={() => {
        void copyTextToClipboard(value)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          })
          .catch(() => undefined);
      }}
      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}

function SecretCell({ secret, isTwoFa }: { secret: string | null; isTwoFa?: boolean }) {
  const [visible, setVisible] = useState(false);
  const value = secret?.trim() || null;

  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-0.5 rounded-lg border px-1.5 py-1",
        isTwoFa ? "border-amber-500/20 bg-amber-500/[0.06]" : "border-border/70 bg-muted/40",
      )}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-xs tracking-wide text-foreground">
        {visible ? value : "••••••••••••"}
      </span>
      <button
        type="button"
        title={visible ? "Hide secret" : "Show secret"}
        aria-label={visible ? "Hide secret" : "Show secret"}
        onClick={() => setVisible((v) => !v)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
      >
        {visible ? (
          <EyeOff className="size-3.5" aria-hidden />
        ) : (
          <Eye className="size-3.5" aria-hidden />
        )}
      </button>
      <CopyIconButton value={value} label="secret" />
    </div>
  );
}

function UsernameCell({ username }: { username: string | null }) {
  const value = username?.trim() || null;
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <span className="min-w-0 flex-1 truncate text-foreground">{value}</span>
      <CopyIconButton value={value} label="username" />
    </div>
  );
}

function pathChip(row: SecureCredential): string {
  const owner = row.owner_name?.trim() || (row.owner_user_id > 0 ? `#${row.owner_user_id}` : "—");
  if (row.vault_scope === "job") {
    return `${owner} › Jobs › ${row.employer_name?.trim() || "Employer"} › ${row.service_name}`;
  }
  return `${owner} › Personal › ${row.service_name}`;
}

export function SecureCredentialsTable({
  items,
  loading,
  hasLoaded,
  showOwner = false,
  showPath = false,
  heading,
  subheading,
  breadcrumb,
  emptyTitle,
  emptyDescription,
  primaryActionLabel,
  secondaryActionLabel,
  dangerActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  onDangerAction,
  onEdit,
  onDelete,
}: SecureCredentialsTableProps) {
  if (!hasLoaded && loading) {
    return (
      <div className="flex h-full min-h-[20rem] animate-pulse flex-col bg-muted/20">
        <div className="h-14 border-b border-border/60 bg-muted/40" />
        <div className="flex-1 bg-muted/10" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-gradient-to-r from-card to-muted/20 px-4 py-3.5">
        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 ? (
            <p className="mb-0.5 truncate text-[11px] text-muted-foreground">
              {breadcrumb.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`}>
                  {index > 0 ? <span> › </span> : null}
                  {crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="font-medium text-primary hover:underline"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </span>
              ))}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 shrink-0 text-primary" aria-hidden />
            <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
              {heading}
            </h2>
          </div>
          {subheading ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subheading}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dangerActionLabel && onDangerAction ? (
            <button
              type="button"
              onClick={onDangerAction}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-card px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              {dangerActionLabel}
            </button>
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              {secondaryActionLabel}
            </button>
          ) : null}
          {primaryActionLabel && onPrimaryAction ? (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="size-4" aria-hidden />
              {primaryActionLabel}
            </button>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-muted/40 text-muted-foreground">
            <KeyRound className="size-7" aria-hidden />
          </div>
          <p className="text-base font-semibold text-foreground">{emptyTitle}</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
          {primaryActionLabel && onPrimaryAction ? (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" aria-hidden />
              {primaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="min-w-0 flex-1 overflow-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-md">
              <tr className="border-b border-border/80 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                {showOwner ? <th className="px-4 py-2.5 font-semibold">Owner</th> : null}
                <th className="px-4 py-2.5 font-semibold">Service</th>
                {showPath ? <th className="px-3 py-2.5 font-semibold">Path</th> : null}
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold">Email / username</th>
                <th className="min-w-[12rem] px-3 py-2.5 font-semibold">Secret</th>
                <th className="px-3 py-2.5 font-semibold">Updated</th>
                <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => {
                const zebra = index % 2 === 1;
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/50 transition-colors last:border-b-0 hover:bg-primary/[0.04]",
                      zebra && "bg-muted/15",
                    )}
                  >
                    {showOwner ? (
                      <td className="max-w-[10rem] px-4 py-2.5">
                        <p className="truncate font-medium">
                          {row.owner_name?.trim() || `#${row.owner_user_id}`}
                        </p>
                      </td>
                    ) : null}
                    <td className="max-w-[14rem] px-4 py-2.5">
                      <p className="truncate font-semibold" title={row.service_name}>
                        {row.service_name}
                      </p>
                      {row.notes?.trim() ? (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {row.notes.trim()}
                        </p>
                      ) : null}
                    </td>
                    {showPath ? (
                      <td className="max-w-[16rem] px-3 py-2.5">
                        <span className="line-clamp-2 text-[11px] text-muted-foreground">
                          {pathChip(row)}
                        </span>
                      </td>
                    ) : null}
                    <td className="px-3 py-2.5">
                      <TypeBadge type={row.credential_type} />
                    </td>
                    <td className="max-w-[12rem] px-3 py-2.5">
                      <UsernameCell username={row.username} />
                    </td>
                    <td className="max-w-[15rem] px-3 py-2.5">
                      <SecretCell
                        secret={row.secret}
                        isTwoFa={isTwoFaCredentialType(row.credential_type)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDateTime(row.updated_at)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center justify-end gap-0.5">
                        <IconAction label="Edit credential" onClick={() => onEdit(row)}>
                          <Pencil className="size-3.5" aria-hidden />
                        </IconAction>
                        <IconAction
                          label="Delete credential"
                          tone="danger"
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export type VaultOwnerSummary = {
  id: number;
  name: string;
  detail?: string;
  count: number;
};
