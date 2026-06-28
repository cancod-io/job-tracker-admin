"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Shield, UserRound } from "lucide-react";
import { roleLabel } from "@/lib/user-approval";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

type RoleOption = {
  value: UserRole;
  label: string;
  description: string;
  icon: typeof Shield;
  iconClass: string;
  selectedRing: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access to all features and settings",
    icon: Shield,
    iconClass: "bg-primary/15 text-primary",
    selectedRing: "border-primary ring-2 ring-primary/20",
  },
  {
    value: "moderator",
    label: "Moderator",
    description: "Can manage content and users",
    icon: UserRound,
    iconClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    selectedRing: "border-violet-500 ring-2 ring-violet-500/20",
  },
  {
    value: "user",
    label: "User",
    description: "Limited access to basic features",
    icon: UserRound,
    iconClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    selectedRing: "border-emerald-500 ring-2 ring-emerald-500/20",
  },
];

function isUserRole(value: string): value is UserRole {
  return value === "admin" || value === "moderator" || value === "user";
}

type AdminUserRoleSectionProps = {
  currentRole: string;
  canEdit: boolean;
  isSelf: boolean;
  saving: boolean;
  onSave: (role: UserRole) => Promise<void>;
  embedded?: boolean;
};

export function AdminUserRoleSection({
  currentRole,
  canEdit,
  isSelf,
  saving,
  onSave,
  embedded = false,
}: AdminUserRoleSectionProps) {
  const showEditor = canEdit && !isSelf;
  const resolvedRole: UserRole = isUserRole(currentRole) ? currentRole : "user";
  const [draftRole, setDraftRole] = useState<UserRole>(resolvedRole);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEditing(false);
    setDraftRole(resolvedRole);
  }, [resolvedRole]);

  const activeOption = ROLE_OPTIONS.find((o) => o.value === resolvedRole) ?? ROLE_OPTIONS[2]!;
  const ActiveIcon = activeOption.icon;

  const openEditor = () => {
    setDraftRole(isUserRole(currentRole) ? currentRole : "user");
    setEditing(true);
  };

  const handleSave = async () => {
    if (draftRole === resolvedRole) {
      setEditing(false);
      return;
    }
    await onSave(draftRole);
    setEditing(false);
  };

  return (
    <section className={cn(!embedded && "border-b border-border/60 px-5 py-4", embedded && "p-5")}>
      <div className="mb-3 flex items-center gap-2">
        <Shield className="size-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">Account & Role</h3>
      </div>

      {!editing ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                activeOption.iconClass,
              )}
            >
              <ActiveIcon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{roleLabel(currentRole)}</p>
              <p className="text-xs text-muted-foreground">{activeOption.description}</p>
            </div>
          </div>
          {showEditor ? (
            <button
              type="button"
              onClick={openEditor}
              disabled={saving}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Pencil className="size-3.5" aria-hidden />
              Change role
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2" role="radiogroup" aria-label="Select user role">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = draftRole === option.value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDraftRole(option.value)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-3 text-left transition-colors",
                      selected ? option.selectedRing : "border-border/70 hover:bg-muted/30",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        option.iconClass,
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "size-4 shrink-0 rounded-full border-2",
                        selected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40 bg-transparent",
                      )}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Save role
            </button>
          </div>
        </div>
      )}

      {isSelf && canEdit ? (
        <p className="mt-2 text-xs text-muted-foreground">
          You cannot change your own role from this panel.
        </p>
      ) : null}
    </section>
  );
}
