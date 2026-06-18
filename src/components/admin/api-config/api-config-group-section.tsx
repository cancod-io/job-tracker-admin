"use client";

import { ApiConfigFieldInput } from "@/components/admin/api-config/api-config-field-input";
import type { ApiConfigGroup } from "@/types/api-config-api";

type ApiConfigGroupSectionProps = {
  group: ApiConfigGroup;
  formValues: Record<string, string>;
  fieldErrors: Record<string, string>;
  clearedKeys: Set<string>;
  disabled?: boolean;
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
  onFieldChange,
  onClearSecret,
  onUndoClearSecret,
}: ApiConfigGroupSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <header className="border-b border-border/80 bg-muted/40 px-4 py-3 md:px-5">
        <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
        {group.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-2 md:px-5 md:py-5">
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
    </section>
  );
}
