"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Monitor,
  Plus,
  Search,
  UserRound,
  Wrench,
} from "lucide-react";
import { countryFlagEmoji } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type { CredentialTreeResponse } from "@/types/secure-credentials";

export type VaultTreeSelection =
  | { kind: "root" }
  | { kind: "accounts" }
  | { kind: "identity"; identityId: number }
  | { kind: "devices" }
  | { kind: "apps" }
  | { kind: "jobs" }
  | { kind: "employer"; employerId: number };

type VaultTreeProps = {
  tree: CredentialTreeResponse | null;
  selection: VaultTreeSelection;
  ownerName: string | null;
  loading: boolean;
  onSelect: (selection: VaultTreeSelection) => void;
  onAddIdentity?: () => void;
  onAddEmployer?: () => void;
};

export function VaultTree({
  tree,
  selection,
  ownerName,
  loading,
  onSelect,
  onAddIdentity,
  onAddEmployer,
}: VaultTreeProps) {
  const [filter, setFilter] = useState("");
  const [personalOpen, setPersonalOpen] = useState(true);
  const [accountsOpen, setAccountsOpen] = useState(true);
  const [jobsOpen, setJobsOpen] = useState(true);

  const filterQ = filter.trim().toLowerCase();

  const identities = useMemo(() => {
    const list = tree?.personal.accounts.identities ?? [];
    if (!filterQ) return list;
    return list.filter(
      (ident) =>
        ident.display_name.toLowerCase().includes(filterQ) ||
        (ident.country_code?.toLowerCase().includes(filterQ) ?? false),
    );
  }, [tree?.personal.accounts.identities, filterQ]);

  const employers = useMemo(() => {
    const list = tree?.jobs.employers ?? [];
    if (!filterQ) return list;
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(filterQ) ||
        (e.website_url?.toLowerCase().includes(filterQ) ?? false),
    );
  }, [tree?.jobs.employers, filterQ]);

  if (loading && !tree) {
    return (
      <div className="flex h-full animate-pulse flex-col gap-2 bg-muted/20 p-3">
        <div className="h-8 rounded-lg bg-muted/60" />
        <div className="h-6 rounded bg-muted/40" />
        <div className="h-6 rounded bg-muted/40" />
        <div className="h-6 rounded bg-muted/40" />
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <FolderOpen className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">Select a person</p>
        <p className="text-xs text-muted-foreground">
          Pick someone in the directory to browse Personal and Jobs folders.
        </p>
      </div>
    );
  }

  const total = tree.personal.count + tree.jobs.credential_count;
  const jobsExpanded =
    selection.kind === "jobs" || selection.kind === "employer" || jobsOpen || employers.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/70 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Vault tree
        </p>
        <button
          type="button"
          onClick={() => onSelect({ kind: "root" })}
          className={cn(
            "mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold transition-colors",
            selection.kind === "root"
              ? "bg-primary/15 text-primary"
              : "text-foreground hover:bg-muted/60",
          )}
        >
          <UserRound className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {ownerName?.trim() || tree.owner_name?.trim() || `User #${tree.owner_user_id}`}
          </span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {total}
          </span>
        </button>
        <label className="relative mt-2 block">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tree…"
            className="w-full rounded-lg border border-border/80 bg-card py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter vault tree"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-2 text-sm">
        <div className="mb-1">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setPersonalOpen((v) => !v)}
              className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
              aria-label={personalOpen ? "Collapse Personal" : "Expand Personal"}
            >
              {personalOpen ? (
                <ChevronDown className="size-3.5" aria-hidden />
              ) : (
                <ChevronRight className="size-3.5" aria-hidden />
              )}
            </button>
            <span className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 font-medium">
              <FolderOpen className="size-3.5 shrink-0 opacity-80" aria-hidden />
              Personal
              <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {tree.personal.count}
              </span>
            </span>
          </div>

          {personalOpen ? (
            <ul className="ml-6 space-y-0.5 border-l border-border/60 py-0.5 pl-2">
              <li>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setAccountsOpen((v) => !v)}
                    className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                    aria-label={accountsOpen ? "Collapse Accounts" : "Expand Accounts"}
                  >
                    {accountsOpen ? (
                      <ChevronDown className="size-3" aria-hidden />
                    ) : (
                      <ChevronRight className="size-3" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelect({ kind: "accounts" })}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                      selection.kind === "accounts"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/70",
                    )}
                  >
                    <span>Accounts</span>
                    <span
                      className={cn(
                        "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                        selection.kind === "accounts"
                          ? "bg-white/20"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {tree.personal.accounts.identity_count}
                    </span>
                  </button>
                </div>
                {accountsOpen
                  ? identities.map((ident) => {
                      const active =
                        selection.kind === "identity" && selection.identityId === ident.id;
                      return (
                        <button
                          key={ident.id}
                          type="button"
                          onClick={() => onSelect({ kind: "identity", identityId: ident.id })}
                          className={cn(
                            "ml-5 mt-0.5 flex w-[calc(100%-1.25rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                            active ? "bg-primary text-primary-foreground" : "hover:bg-muted/70",
                          )}
                        >
                          <span className="shrink-0 text-sm leading-none" aria-hidden>
                            {countryFlagEmoji(ident.country_code)}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {ident.display_name}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] tabular-nums",
                              active ? "opacity-90" : "text-muted-foreground",
                            )}
                          >
                            {ident.count}
                          </span>
                        </button>
                      );
                    })
                  : null}
                {onAddIdentity ? (
                  <button
                    type="button"
                    onClick={onAddIdentity}
                    className="ml-5 mt-0.5 flex w-[calc(100%-1.25rem)] items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
                  >
                    <Plus className="size-3" aria-hidden />
                    Add identity
                  </button>
                ) : null}
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onSelect({ kind: "devices" })}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                    selection.kind === "devices"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/70",
                  )}
                >
                  <Monitor className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span>Devices & remote</span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      selection.kind === "devices"
                        ? "bg-white/20"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tree.personal.devices.count}
                  </span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => onSelect({ kind: "apps" })}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                    selection.kind === "apps"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/70",
                  )}
                >
                  <Wrench className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span>Apps & other</span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      selection.kind === "apps" ? "bg-white/20" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tree.personal.apps.count}
                  </span>
                </button>
              </li>
            </ul>
          ) : null}
        </div>

        <div className="my-2 border-t border-border/60" />

        <div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setJobsOpen((v) => !v)}
              className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
              aria-label={jobsOpen ? "Collapse Jobs" : "Expand Jobs"}
            >
              {jobsOpen ? (
                <ChevronDown className="size-3.5" aria-hidden />
              ) : (
                <ChevronRight className="size-3.5" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => onSelect({ kind: "jobs" })}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                selection.kind === "jobs"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/70",
              )}
            >
              <Briefcase className="size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium">Jobs</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  selection.kind === "jobs" ? "bg-white/20" : "bg-muted text-muted-foreground",
                )}
              >
                {tree.jobs.credential_count}
              </span>
            </button>
          </div>
          {jobsExpanded ? (
            <ul className="ml-6 space-y-0.5 border-l border-border/60 py-0.5 pl-2">
              {employers.length === 0 ? (
                <li className="px-2 py-1 text-xs text-muted-foreground">
                  No employers yet — add one under Jobs
                </li>
              ) : (
                employers.map((emp) => {
                  const active = selection.kind === "employer" && selection.employerId === emp.id;
                  return (
                    <li key={emp.id}>
                      <button
                        type="button"
                        onClick={() => onSelect({ kind: "employer", employerId: emp.id })}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                          active ? "bg-primary text-primary-foreground" : "hover:bg-muted/70",
                        )}
                      >
                        <Building2 className="size-3.5 shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-medium">{emp.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                            active ? "bg-white/20" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {emp.count}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
              {onAddEmployer ? (
                <li>
                  <button
                    type="button"
                    onClick={onAddEmployer}
                    className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
                  >
                    <Plus className="size-3" aria-hidden />
                    Add employer
                  </button>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
