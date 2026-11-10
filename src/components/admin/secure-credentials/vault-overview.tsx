"use client";

import { Briefcase, FolderOpen, UserRound } from "lucide-react";

type VaultOverviewProps = {
  ownerLabel: string;
  personalCount: number;
  employerCount: number;
  jobCredentialCount: number;
  onOpenPersonal: () => void;
  onOpenJobs: () => void;
};

export function VaultOverview({
  ownerLabel,
  personalCount,
  employerCount,
  jobCredentialCount,
  onOpenPersonal,
  onOpenJobs,
}: VaultOverviewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/70 bg-gradient-to-r from-card to-muted/20 px-4 py-3.5">
        <p className="text-[11px] text-muted-foreground">{ownerLabel}</p>
        <h2 className="mt-0.5 text-base font-semibold tracking-tight">Vault overview</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Personal life accounts and job folders stay separate
        </p>
      </div>
      <div className="grid flex-1 content-start gap-3 p-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onOpenPersonal}
          className="flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
            <UserRound className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold">Personal</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Gmail, PC login, personal 2FA, and other life accounts
            </span>
          </span>
          <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <FolderOpen className="size-3.5" aria-hidden />
            {personalCount} credential{personalCount === 1 ? "" : "s"}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenJobs}
          className="flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
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
