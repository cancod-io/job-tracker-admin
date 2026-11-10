"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Search,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CredentialTreeResponse } from "@/types/secure-credentials";

export type VaultTreeSelection =
  | { kind: "root" }
  | { kind: "personal" }
  | { kind: "jobs" }
  | { kind: "employer"; employerId: number };

type VaultTreeProps = {
  tree: CredentialTreeResponse | null;
  selection: VaultTreeSelection;
  ownerName: string | null;
  loading: boolean;
  onSelect: (selection: VaultTreeSelection) => void;
};

export function VaultTree({ tree, selection, ownerName, loading, onSelect }: VaultTreeProps) {
  const [filter, setFilter] = useState("");
  const [personalOpen, setPersonalOpen] = useState(true);
  const [jobsOpen, setJobsOpen] = useState(true);

  const employers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = tree?.jobs.employers ?? [];
    if (!q) return list;
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) || (e.website_url?.toLowerCase().includes(q) ?? false),
    );
  }, [tree?.jobs.employers, filter]);

  const personalLeaves = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = tree?.personal.items ?? [];
    if (!q) return list;
    return list.filter(
      (c) =>
        c.service_name.toLowerCase().includes(q) ||
        (c.username?.toLowerCase().includes(q) ?? false),
    );
  }, [tree?.personal.items, filter]);

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
            <button
              type="button"
              onClick={() => onSelect({ kind: "personal" })}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                selection.kind === "personal"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/70",
              )}
            >
              <FolderOpen className="size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium">Personal</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  selection.kind === "personal" ? "bg-white/20" : "bg-muted text-muted-foreground",
                )}
              >
                {tree.personal.count}
              </span>
            </button>
          </div>
          {personalOpen ? (
            <ul className="ml-6 space-y-0.5 border-l border-border/60 py-0.5 pl-2">
              {personalLeaves.length === 0 ? (
                <li className="px-2 py-1 text-xs text-muted-foreground">No personal entries</li>
              ) : (
                personalLeaves.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onSelect({ kind: "personal" })}
                      className="flex w-full truncate rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      title={c.service_name}
                    >
                      {c.service_name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

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
                {tree.jobs.employer_count} emp
              </span>
            </button>
          </div>
          {jobsOpen ? (
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
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
