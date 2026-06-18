"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ApiConfigFieldInput } from "@/components/admin/api-config/api-config-field-input";
import type { ApiConfigGroup } from "@/types/api-config-api";

type ApiConfigGroupSectionProps = {
  group: ApiConfigGroup;
  formValues: Record<string, string>;
  fieldErrors: Record<string, string>;
  clearedKeys: Set<string>;
  disabled?: boolean;
  defaultOpen?: boolean;
  onFieldChange: (key: string, value: string) => void;
  onClearSecret: (key: string) => void;
  onUndoClearSecret: (key: string) => void;
};

export function ApiConfigGroupSection({
  group,
  formValues,
  fieldErrors,
  clearedKeys,
  disabled = false,
  defaultOpen = true,
  onFieldChange,
  onClearSecret,
  onUndoClearSecret,
}: ApiConfigGroupSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 md:px-5 md:py-4"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`api-config-group-${group.key}`}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground md:text-base">{group.label}</h2>
          {group.description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
          ) : null}
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
          className="grid grid-cols-1 gap-4 border-t border-border/80 px-4 py-4 md:grid-cols-2 md:px-5 md:py-5"
        >
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
      ) : null}
    </section>
  );
}
