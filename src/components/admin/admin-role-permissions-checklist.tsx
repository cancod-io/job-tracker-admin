"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  Link2,
  Loader2,
  Radar,
  Save,
  Settings,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  displayDescriptionForPermission,
  displayLabelForPermission,
  filterDisplayCatalog,
  filterDisplayPermissions,
  groupCatalogByCategory,
  isAdminRole,
  roleHasPermission,
} from "@/lib/admin-permissions";
import { roleLabel } from "@/lib/user-approval";
import { cn } from "@/lib/utils";
import type { AdminPermissionsResponse } from "@/types/admin-permissions-api";
import type { UserRole } from "@/types/auth";

const EMPTY_PERMISSIONS: string[] = [];

/** Icon + accent tint per permission category (matched case-insensitively). */
const CATEGORY_STYLES: Record<string, { icon: LucideIcon; tile: string }> = {
  users: { icon: Users, tile: "bg-blue-500/15 text-blue-600 dark:text-blue-300" },
  jobs: { icon: Briefcase, tile: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
  applications: { icon: FileText, tile: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  companies: { icon: Building2, tile: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  scraping: { icon: Radar, tile: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300" },
  "api configuration": {
    icon: Settings,
    tile: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
  },
  "block lists": {
    icon: ShieldAlert,
    tile: "bg-red-500/15 text-red-600 dark:text-red-300",
  },
  "career urls": { icon: Link2, tile: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300" },
  stats: { icon: BarChart3, tile: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
  analytics: { icon: BarChart3, tile: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
  permissions: { icon: ShieldCheck, tile: "bg-primary/15 text-primary" },
};

const DEFAULT_CATEGORY_STYLE = {
  icon: Settings2,
  tile: "bg-muted text-muted-foreground",
} satisfies { icon: LucideIcon; tile: string };

function categoryStyle(name: string) {
  return CATEGORY_STYLES[name.trim().toLowerCase()] ?? DEFAULT_CATEGORY_STYLE;
}

function ToggleVisual({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-emerald-500" : "bg-muted-foreground/25",
      )}
      aria-hidden
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-[1.125rem]" : "translate-x-0.5",
        )}
      />
    </span>
  );
}

type AdminRolePermissionsChecklistProps = {
  targetRole: UserRole | string;
  matrix: AdminPermissionsResponse | null;
  loading?: boolean;
  /** When true, moderator/user roles can toggle switches and save. */
  editable?: boolean;
  onSave?: (permissions: string[]) => Promise<void>;
  compact?: boolean;
  /** Role template editor vs per-user grants. */
  scope?: "role" | "user";
  scopeTitle?: string;
  /** Per-user stored grants (scope=user). */
  userPermissions?: string[];
  /** Informational role preset (scope=user). */
  roleTemplate?: string[];
  hintText?: string;
  saveLabel?: string;
};

export function AdminRolePermissionsChecklist({
  targetRole,
  matrix,
  loading = false,
  editable = false,
  onSave,
  compact = false,
  scope = "role",
  scopeTitle,
  userPermissions,
  roleTemplate,
  hintText,
  saveLabel,
}: AdminRolePermissionsChecklistProps) {
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const roleEntry = useMemo(
    () => matrix?.roles.find((r) => r.role === targetRole),
    [matrix, targetRole],
  );

  const displayCatalog = useMemo(() => filterDisplayCatalog(matrix?.catalog ?? []), [matrix]);
  const catalogKeys = useMemo(() => displayCatalog.map((c) => c.key), [displayCatalog]);
  const groups = useMemo(() => groupCatalogByCategory(displayCatalog), [displayCatalog]);

  const fullAccess = isAdminRole(targetRole);
  const isUserScope = scope === "user";
  const roleEditable = editable && !fullAccess && (isUserScope ? true : (roleEntry?.editable ?? !fullAccess));
  const granted = useMemo(() => {
    if (isUserScope && userPermissions !== undefined) {
      return filterDisplayPermissions(userPermissions);
    }
    return filterDisplayPermissions(roleEntry?.permissions ?? EMPTY_PERMISSIONS);
  }, [isUserScope, userPermissions, roleEntry]);

  const sourceDraftKey = useMemo(() => {
    if (fullAccess) return `admin:${catalogKeys.join("|")}`;
    if (isUserScope) return `user:${targetRole}:${granted.join("|")}`;
    return `${targetRole}:${granted.join("|")}`;
  }, [fullAccess, catalogKeys, granted, isUserScope, targetRole]);

  useEffect(() => {
    setDraft(new Set(fullAccess ? catalogKeys : granted));
    setSaveSuccess(null);
    // Resync draft only when role or permission list content changes (see sourceDraftKey).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalogKeys/granted read from closure when key changes
  }, [sourceDraftKey]);

  const resetDraft = useCallback(() => {
    setDraft(new Set(fullAccess ? catalogKeys : granted));
    setSaveSuccess(null);
  }, [fullAccess, catalogKeys, granted]);

  const isOn = useCallback(
    (key: string) =>
      roleEditable ? draft.has(key) : roleHasPermission(targetRole, granted, key, catalogKeys),
    [roleEditable, draft, targetRole, granted, catalogKeys],
  );

  const toggle = (key: string) => {
    if (!roleEditable) return;
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSaveSuccess(null);
  };

  const setMany = (keys: string[], on: boolean) => {
    if (!roleEditable) return;
    setDraft((prev) => {
      const next = new Set(prev);
      for (const key of keys) {
        if (on) next.add(key);
        else next.delete(key);
      }
      return next;
    });
    setSaveSuccess(null);
  };

  const handleSave = async () => {
    if (!onSave || !roleEditable) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await onSave(filterDisplayPermissions(Array.from(draft)).sort());
      setSaveSuccess(
        isUserScope
          ? "Saved user permissions."
          : `Saved ${roleLabel(targetRole)} permissions.`,
      );
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !matrix) {
    return <p className="text-sm text-muted-foreground">Loading permissions…</p>;
  }

  if (!matrix || matrix.catalog.length === 0) {
    return <p className="text-sm text-muted-foreground">No permission data available.</p>;
  }

  const total = catalogKeys.length;
  const enabledCount = fullAccess ? total : catalogKeys.filter((k) => isOn(k)).length;
  const pct = total > 0 ? Math.round((enabledCount / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/40">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                fullAccess ? "bg-primary/15 text-primary" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
              )}
            >
              <Shield className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {scopeTitle ?? `${roleLabel(targetRole)} access`}
              </p>
              <p className="text-xs text-muted-foreground">
                {fullAccess
                  ? "Full access — every permission, not editable"
                  : `${enabledCount} of ${total} permissions enabled`}
              </p>
            </div>
          </div>
          {roleEditable ? (
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setMany(catalogKeys, true)}
                disabled={saving}
                className="rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setMany(catalogKeys, false)}
                disabled={saving}
                className="rounded-lg border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
          ) : (
            <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
              {enabledCount}/{total}
            </span>
          )}
        </div>
        <div className="h-1.5 w-full bg-muted">
          <div
            className={cn(
              "h-full rounded-r-full transition-all duration-500",
              fullAccess ? "bg-primary" : "bg-emerald-500",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {!fullAccess && roleEditable && !isUserScope ? (
        <p className="text-xs text-muted-foreground">
          Changes apply to <span className="font-medium text-foreground">new registrations only</span>{" "}
          with the <span className="font-medium text-foreground">{roleLabel(targetRole)}</span> role.
          To change an existing user, edit their permissions on the user detail page.
        </p>
      ) : null}

      {!fullAccess && hintText ? (
        <p className="text-xs text-muted-foreground">{hintText}</p>
      ) : null}

      {!fullAccess && isUserScope && roleTemplate && roleTemplate.length > 0 && !hintText ? (
        <p className="text-xs text-muted-foreground">
          Default for <span className="font-medium text-foreground">{roleLabel(targetRole)}</span> role:{" "}
          {roleTemplate.join(", ")}.
        </p>
      ) : null}

      {saveError ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {saveError}
        </p>
      ) : null}
      {saveSuccess ? (
        <p
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {saveSuccess}
        </p>
      ) : null}

      {/* Category cards */}
      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "lg:grid-cols-2")}>
        {groups.map((group) => {
          const keys = group.items.map((i) => i.key);
          const onCount = keys.filter((k) => isOn(k)).length;
          const allOn = onCount === keys.length;
          const style = categoryStyle(group.category);
          const Icon = style.icon;

          return (
            <section
              key={group.category}
              className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
            >
              <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    style.tile,
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {group.category}
                  </h4>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {fullAccess ? `${keys.length} of ${keys.length}` : `${onCount} of ${keys.length}`}{" "}
                    enabled
                  </p>
                </div>
                {roleEditable ? (
                  <button
                    type="button"
                    onClick={() => setMany(keys, !allOn)}
                    disabled={saving}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                  >
                    {allOn ? "Disable all" : "Enable all"}
                  </button>
                ) : null}
              </header>

              <ul className="flex-1 divide-y divide-border/40">
                {group.items.map((item) => {
                  const enabled = isOn(item.key);
                  const RowTag = roleEditable ? "button" : "div";

                  return (
                    <li key={item.key}>
                      <RowTag
                        {...(roleEditable
                          ? {
                              type: "button" as const,
                              role: "switch",
                              "aria-checked": enabled,
                              onClick: () => toggle(item.key),
                              disabled: saving,
                            }
                          : {})}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          roleEditable && "hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60",
                          !roleEditable && !enabled && "opacity-55",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground">
                            {displayLabelForPermission(item)}
                          </span>
                          {item.description ? (
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {displayDescriptionForPermission(item)}
                            </span>
                          ) : null}
                        </span>
                        <ToggleVisual on={enabled} />
                      </RowTag>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {fullAccess ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="size-3.5 shrink-0 text-primary" aria-hidden />
          Admin always has every permission. Edit Moderator or User roles to grant similar access.
        </p>
      ) : null}

      {roleEditable && onSave ? (
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{draft.size}</span> permission
            {draft.size === 1 ? "" : "s"} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetDraft}
              disabled={saving}
              className="rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Save className="size-3.5" aria-hidden />
              )}
              Save {saveLabel ?? roleLabel(targetRole)}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
