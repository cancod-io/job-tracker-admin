"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import {
  credentialTypeBadgeClass,
  formatCredentialType,
  isEmailCredentialType,
  isTwoFaCredentialType,
} from "@/components/admin/secure-credentials/constants";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { SecureCredential } from "@/types/secure-credentials";

export type VaultOwnerSummary = {
  id: number;
  name: string;
  detail?: string;
  count: number;
};

type SecureCredentialsTableProps = {
  items: SecureCredential[];
  owners: VaultOwnerSummary[];
  selectedOwnerId: number | "all";
  loading: boolean;
  hasLoaded: boolean;
  filtersActive: boolean;
  searchActive: boolean;
  onSelectOwner: (ownerId: number | "all") => void;
  onEdit: (row: SecureCredential) => void;
  onDelete: (row: SecureCredential) => void;
  onAdd: () => void;
  onAddForOwner: (ownerUserId: number) => void;
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

function ownerLabel(row: SecureCredential): string {
  return (
    row.owner_name?.trim() || (row.owner_user_id > 0 ? `User #${row.owner_user_id}` : "Unknown")
  );
}

function MobileCredentialRow({
  row,
  showOwner,
  onEdit,
  onDelete,
}: {
  row: SecureCredential;
  showOwner: boolean;
  onEdit: (row: SecureCredential) => void;
  onDelete: (row: SecureCredential) => void;
}) {
  return (
    <li className="space-y-3 border-b border-border/60 px-4 py-3.5 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-foreground">{row.service_name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <TypeBadge type={row.credential_type} />
            {showOwner ? (
              <span className="truncate text-xs text-muted-foreground">{ownerLabel(row)}</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0">
          <IconAction label="Edit credential" onClick={() => onEdit(row)}>
            <Pencil className="size-3.5" aria-hidden />
          </IconAction>
          <IconAction label="Delete credential" tone="danger" onClick={() => onDelete(row)}>
            <Trash2 className="size-3.5" aria-hidden />
          </IconAction>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-[4.75rem_1fr] items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isTwoFaCredentialType(row.credential_type)
              ? "Label"
              : isEmailCredentialType(row.credential_type)
                ? "Email"
                : "User"}
          </span>
          <UsernameCell username={row.username} />
        </div>
        <div className="grid grid-cols-[4.75rem_1fr] items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isTwoFaCredentialType(row.credential_type) ? "2FA" : "Secret"}
          </span>
          <SecretCell secret={row.secret} isTwoFa={isTwoFaCredentialType(row.credential_type)} />
        </div>
        {row.notes?.trim() ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{row.notes.trim()}</p>
        ) : null}
      </div>
    </li>
  );
}

export function SecureCredentialsTable({
  items,
  owners,
  selectedOwnerId,
  loading,
  hasLoaded,
  filtersActive,
  searchActive,
  onSelectOwner,
  onEdit,
  onDelete,
  onAdd,
  onAddForOwner,
}: SecureCredentialsTableProps) {
  const [peopleQuery, setPeopleQuery] = useState("");

  const selectedOwner = useMemo(
    () =>
      selectedOwnerId === "all" ? null : (owners.find((o) => o.id === selectedOwnerId) ?? null),
    [owners, selectedOwnerId],
  );

  const totalCount = useMemo(() => owners.reduce((sum, o) => sum + o.count, 0), [owners]);

  const filteredOwners = useMemo(() => {
    const q = peopleQuery.trim().toLowerCase();
    if (!q) return owners;
    return owners.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.detail?.toLowerCase().includes(q) ?? false) ||
        String(o.id).includes(q),
    );
  }, [owners, peopleQuery]);

  const heading =
    selectedOwnerId === "all"
      ? "All credentials"
      : selectedOwner
        ? selectedOwner.name
        : "Selected vault";

  const subheading =
    selectedOwnerId === "all"
      ? `${items.length} visible · select a person to focus one vault`
      : selectedOwner
        ? `${selectedOwner.count} credential${selectedOwner.count === 1 ? "" : "s"} in this vault`
        : "No owner selected";

  if (!hasLoaded && loading) {
    return (
      <div className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:grid-cols-[17.5rem_1fr]">
        <div className="animate-pulse border-b border-border/70 bg-muted/40 lg:border-b-0 lg:border-r" />
        <div className="animate-pulse bg-muted/20" />
      </div>
    );
  }

  return (
    <div className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="flex max-h-[42vh] flex-col border-b border-border/70 bg-gradient-to-b from-muted/40 to-muted/10 lg:max-h-none lg:border-b-0 lg:border-r">
        <div className="border-b border-border/70 px-3.5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Directory
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">Whose vault?</p>
          <label className="relative mt-3 block">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={peopleQuery}
              onChange={(e) => setPeopleQuery(e.target.value)}
              placeholder="Filter people…"
              className="w-full rounded-lg border border-border/80 bg-card py-2 pl-8 pr-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filter people"
            />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => onSelectOwner("all")}
            className={cn(
              "mb-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-all",
              selectedOwnerId === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-card/80",
            )}
          >
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                selectedOwnerId === "all" ? "bg-white/20" : "bg-primary/10 text-primary",
              )}
            >
              <Users className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">Everyone</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                selectedOwnerId === "all" ? "bg-white/15" : "bg-muted text-muted-foreground",
              )}
            >
              {totalCount || items.length}
            </span>
          </button>
          {filteredOwners.length === 0 ? (
            <p className="px-2.5 py-4 text-xs text-muted-foreground">
              {owners.length === 0 ? "No vault owners yet." : "No people match that filter."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredOwners.map((owner) => {
                const active = selectedOwnerId === owner.id;
                return (
                  <li key={owner.id}>
                    <button
                      type="button"
                      onClick={() => onSelectOwner(owner.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-all",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-card/80",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          active ? "bg-white/20" : "bg-primary/10 text-primary",
                        )}
                      >
                        {owner.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{owner.name}</span>
                        {owner.detail ? (
                          <span
                            className={cn(
                              "block truncate text-[11px]",
                              active ? "text-primary-foreground/75" : "text-muted-foreground",
                            )}
                          >
                            {owner.detail}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                          active ? "bg-white/15" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {owner.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-gradient-to-r from-card to-muted/20 px-4 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 shrink-0 text-primary" aria-hidden />
              <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                {heading}
              </h2>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subheading}</p>
          </div>
          <button
            type="button"
            onClick={() => (selectedOwnerId === "all" ? onAdd() : onAddForOwner(selectedOwnerId))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            {selectedOwnerId === "all" ? "Add credential" : "Add for this person"}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-muted/40 text-muted-foreground">
              <KeyRound className="size-7" aria-hidden />
            </div>
            <p className="text-base font-semibold text-foreground">
              {searchActive || filtersActive
                ? "Nothing matches these filters"
                : selectedOwnerId === "all"
                  ? "Vault is empty"
                  : "No credentials for this person"}
            </p>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Save a PC login, Gmail, Outlook, or 2FA key. You can reveal and copy secrets from the
              table after saving.
            </p>
            <button
              type="button"
              onClick={() => (selectedOwnerId === "all" ? onAdd() : onAddForOwner(selectedOwnerId))}
              className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" aria-hidden />
              Add credential
            </button>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border/60 md:hidden">
              {items.map((row) => (
                <MobileCredentialRow
                  key={row.id}
                  row={row}
                  showOwner={selectedOwnerId === "all"}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </ul>

            <div className="hidden min-w-0 flex-1 overflow-auto md:block">
              <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-md">
                  <tr className="border-b border-border/80 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                    {selectedOwnerId === "all" ? (
                      <th className="sticky left-0 z-[1] bg-muted/95 px-4 py-2.5 font-semibold backdrop-blur-md">
                        Owner
                      </th>
                    ) : null}
                    <th
                      className={cn(
                        "px-4 py-2.5 font-semibold",
                        selectedOwnerId !== "all" &&
                          "sticky left-0 z-[1] bg-muted/95 backdrop-blur-md",
                      )}
                    >
                      Service
                    </th>
                    <th className="px-3 py-2.5 font-semibold">Type</th>
                    <th className="px-3 py-2.5 font-semibold">Email / username</th>
                    <th className="min-w-[12rem] px-3 py-2.5 font-semibold">Secret</th>
                    <th className="px-3 py-2.5 font-semibold">Updated</th>
                    <th className="sticky right-0 z-[1] bg-muted/95 px-3 py-2.5 text-right font-semibold backdrop-blur-md">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, index) => {
                    const zebra = index % 2 === 1;
                    const rowBg = zebra ? "bg-muted/20" : "bg-card";
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-border/50 transition-colors last:border-b-0 hover:bg-primary/[0.04]",
                          zebra && "bg-muted/15",
                        )}
                      >
                        {selectedOwnerId === "all" ? (
                          <td
                            className={cn("sticky left-0 z-[1] max-w-[11rem] px-4 py-2.5", rowBg)}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                {ownerLabel(row).slice(0, 1).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                  {ownerLabel(row)}
                                </p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  #{row.owner_user_id}
                                </p>
                              </div>
                            </div>
                          </td>
                        ) : null}
                        <td
                          className={cn(
                            "max-w-[15rem] px-4 py-2.5",
                            selectedOwnerId !== "all" && cn("sticky left-0 z-[1]", rowBg),
                          )}
                        >
                          <p
                            className="truncate font-semibold text-foreground"
                            title={row.service_name}
                          >
                            {row.service_name}
                          </p>
                          {row.notes?.trim() ? (
                            <p
                              className="mt-0.5 truncate text-[11px] text-muted-foreground"
                              title={row.notes.trim()}
                            >
                              {row.notes.trim()}
                            </p>
                          ) : null}
                        </td>
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
                        <td className={cn("sticky right-0 z-[1] px-3 py-2.5 text-right", rowBg)}>
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
          </>
        )}
      </section>
    </div>
  );
}
