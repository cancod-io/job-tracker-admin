"use client";

import { Briefcase, Building2, Plus } from "lucide-react";
import type { CredentialTreeEmployerNode } from "@/types/secure-credentials";

type EmployerFolderListProps = {
  employers: CredentialTreeEmployerNode[];
  ownerLabel: string;
  loading?: boolean;
  onOpen: (employerId: number) => void;
  onAddEmployer: () => void;
  onBreadcrumbRoot?: () => void;
};

export function EmployerFolderList({
  employers,
  ownerLabel,
  loading = false,
  onOpen,
  onAddEmployer,
  onBreadcrumbRoot,
}: EmployerFolderListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-gradient-to-r from-card to-muted/20 px-4 py-3.5">
        <div className="min-w-0">
          <p className="mb-0.5 truncate text-[11px] text-muted-foreground">
            {onBreadcrumbRoot ? (
              <>
                <button
                  type="button"
                  onClick={onBreadcrumbRoot}
                  className="font-medium text-primary hover:underline"
                >
                  {ownerLabel}
                </button>
                <span> › Jobs</span>
              </>
            ) : (
              `${ownerLabel} › Jobs`
            )}
          </p>
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 shrink-0 text-primary" aria-hidden />
            <h2 className="truncate text-base font-semibold tracking-tight">Employers</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Open a folder to manage that employer&apos;s logins
          </p>
        </div>
        <button
          type="button"
          onClick={onAddEmployer}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          Add employer
        </button>
      </div>

      {loading ? (
        <div className="flex-1 animate-pulse bg-muted/20" />
      ) : employers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <Building2 className="mb-3 size-10 text-muted-foreground" aria-hidden />
          <p className="text-base font-semibold">No employers yet</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Create an employer folder first, then add careers-portal or work logins inside it.
          </p>
          <button
            type="button"
            onClick={onAddEmployer}
            className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add employer
          </button>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-border/60 overflow-y-auto">
          {employers.map((emp) => (
            <li key={emp.id}>
              <button
                type="button"
                onClick={() => onOpen(emp.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">{emp.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {emp.count} credential{emp.count === 1 ? "" : "s"}
                    {emp.website_url ? ` · ${emp.website_url}` : ""}
                  </span>
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {emp.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
