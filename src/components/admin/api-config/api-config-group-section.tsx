"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Save } from "lucide-react";
import { sourceAccent } from "@/components/admin/api-config/constants";
import { ApiConfigFieldInput } from "@/components/admin/api-config/api-config-field-input";
import { cn } from "@/lib/utils";
import type { ApiConfigGroup } from "@/types/api-config-api";

type ApiConfigGroupSectionProps = {
  group: ApiConfigGroup;
  formValues: Record<string, string>;
  fieldErrors: Record<string, string>;
  clearedKeys: Set<string>;
  disabled?: boolean;
  saving?: boolean;
  hasChanges?: boolean;
  canManage?: boolean;
  defaultOpen?: boolean;
  onFieldChange: (key: string, value: string) => void;
  onClearSecret: (key: string) => void;
  onUndoClearSecret: (key: string) => void;
  onSave: () => void;
};

export function ApiConfigGroupSection({
  group,
  formValues,
  fieldErrors,
  clearedKeys,
  disabled = false,
  saving = false,
  hasChanges = false,
  canManage = false,
  defaultOpen = true,
  onFieldChange,
  onClearSecret,
  onUndoClearSecret,
  onSave,
}: ApiConfigGroupSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const accent = sourceAccent(group.key);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm",
        accent.gradient,
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 md:px-5 md:py-4"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`api-config-group-${group.key}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn("mt-1.5 size-2 shrink-0 rounded-full", accent.dot)}
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground md:text-base">{group.label}</h2>
            {group.description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
            ) : null}
          </div>
        </div>
        {open ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          id={`api-config-group-${group.key}`}
          className="border-t border-border/80 bg-card/60 px-4 py-4 backdrop-blur-sm md:px-5 md:py-5"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {group.fields.map((field) => (
              <div
                key={field.key}
                className={field.value_type === "bool" ? "md:col-span-2" : undefined}
              >
                <ApiConfigFieldInput
                  field={field}
                  value={formValues[field.key] ?? ""}
                  disabled={disabled}
                  error={fieldErrors[field.key]}
                  cleared={clearedKeys.has(field.key)}
                  onChange={(value) => onFieldChange(field.key, value)}
                  onClearSecret={() => onClearSecret(field.key)}
                  onUndoClearSecret={() => onUndoClearSecret(field.key)}
                />
              </div>
            ))}
          </div>

          {canManage ? (
            <div className="mt-5 flex justify-end border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={onSave}
                disabled={disabled || saving || !hasChanges}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                ) : (
                  <Save className="size-4" aria-hidden />
                )}
                Update settings
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
