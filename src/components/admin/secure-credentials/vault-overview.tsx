"use client";

import { Briefcase, Monitor, UserRound, Wrench } from "lucide-react";

type VaultOverviewProps = {
  ownerLabel: string;
  personalCount: number;
  accountsCount: number;
  devicesCount: number;
  appsCount: number;
  employerCount: number;
  jobCredentialCount: number;
  onOpenAccounts: () => void;
  onOpenDevices: () => void;
  onOpenApps: () => void;
  onOpenJobs: () => void;
};

export function VaultOverview({
  ownerLabel,
  personalCount,
  accountsCount,
  devicesCount,
  appsCount,
  employerCount,
  jobCredentialCount,
  onOpenAccounts,
  onOpenDevices,
  onOpenApps,
  onOpenJobs,
}: VaultOverviewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/70 bg-gradient-to-r from-card to-muted/20 px-4 py-3.5">
        <p className="text-[11px] text-muted-foreground">{ownerLabel}</p>
        <h2 className="mt-0.5 text-base font-semibold tracking-tight">Vault overview</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {personalCount} personal credential{personalCount === 1 ? "" : "s"} across identities,
          devices, and apps
        </p>
      </div>
      <div className="grid flex-1 content-start gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={onOpenAccounts}
          className="flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
            <UserRound className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold">Accounts</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Named identities with Gmail, 2FA, LinkedIn…
            </span>
          </span>
          <span className="mt-auto text-xs font-semibold tabular-nums text-muted-foreground">
            {accountsCount} identit{accountsCount === 1 ? "y" : "ies"}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenDevices}
          className="flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
            <Monitor className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold">Devices & remote</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              PC logins and AnyDesk
            </span>
          </span>
          <span className="mt-auto text-xs font-semibold tabular-nums text-muted-foreground">
            {devicesCount} credential{devicesCount === 1 ? "" : "s"}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenApps}
          className="flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <Wrench className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold">Apps & other</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              WhatsApp, tools, and other logins
            </span>
          </span>
          <span className="mt-auto text-xs font-semibold tabular-nums text-muted-foreground">
            {appsCount} credential{appsCount === 1 ? "" : "s"}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenJobs}
          className="flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03] sm:col-span-2 lg:col-span-3"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300">
            <Briefcase className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold">Jobs</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Employer folders with careers portals and work logins
            </span>
          </span>
          <span className="mt-auto text-xs font-semibold text-muted-foreground">
            {employerCount} employer{employerCount === 1 ? "" : "s"} · {jobCredentialCount}{" "}
            credential{jobCredentialCount === 1 ? "" : "s"}
          </span>
        </button>
      </div>
    </div>
  );
}
