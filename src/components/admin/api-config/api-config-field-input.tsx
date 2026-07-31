"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  APIFY_INDEED_DATE_POSTED_OPTIONS,
  getIntConstraints,
  isApifyDatePostedField,
} from "@/lib/api-config-validation";
import {
  SERPAPI_QUERY_ACTIVE_OPTIONS,
  getApiConfigFieldPlaceholder,
  getSerpapiQueryActiveLabel,
  isApiConfigChoiceField,
  isApiConfigMultilineQueryField,
  isSerpapiQueryActiveField,
} from "@/components/admin/api-config/api-config-settings-schema";
import type { ApiConfigField } from "@/types/api-config-api";

const inputClass =
  "w-full rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass = cn(inputClass, "min-h-[5.5rem] resize-y leading-relaxed");

type ApiConfigFieldInputProps = {
  field: ApiConfigField;
  value: string;
  disabled?: boolean;
  error?: string | null;
  cleared: boolean;
  onChange: (value: string) => void;
  onClearSecret: () => void;
  onUndoClearSecret: () => void;
};

function choiceOptionLabel(fieldKey: string, optionValue: string): string {
  if (isSerpapiQueryActiveField(fieldKey)) {
    return getSerpapiQueryActiveLabel(optionValue);
  }
  return optionValue;
}

export function ApiConfigFieldInput({
  field,
  value,
  disabled = false,
  error,
  cleared,
  onChange,
  onClearSecret,
  onUndoClearSecret,
}: ApiConfigFieldInputProps) {
  const [secretVisible, setSecretVisible] = useState(false);
  const constraints = getIntConstraints(field.key);
  const secretConfigured = field.is_secret && field.is_set && !cleared;
  const placeholder = getApiConfigFieldPlaceholder(field.key);
  const multilineQuery = isApiConfigMultilineQueryField(field);
  const choiceField = isApiConfigChoiceField(field);
  const choiceOptions =
    field.allowed_values && field.allowed_values.length > 0
      ? field.allowed_values
      : isSerpapiQueryActiveField(field.key)
        ? SERPAPI_QUERY_ACTIVE_OPTIONS.map((opt) => opt.value)
        : [];

  if (field.value_type === "bool") {
    const checked = value === "true";
    return (
      <div className="space-y-1">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="size-4 rounded border-border accent-primary"
          />
          <span className="text-sm font-medium text-foreground">{field.label}</span>
        </label>
        {field.description ? (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (choiceField && choiceOptions.length > 0) {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">{field.label}</legend>
        {field.description ? (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={field.label}>
          {choiceOptions.map((option) => {
            const optionId = `api-config-${field.key}-${option}`;
            const selected = value === option;
            return (
              <label
                key={option}
                htmlFor={optionId}
                className={cn(
                  "inline-flex min-w-[9.5rem] cursor-pointer items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/80 text-foreground hover:bg-muted/40",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  id={optionId}
                  type="radio"
                  name={`api-config-${field.key}`}
                  value={option}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => onChange(option)}
                  className="size-4 accent-primary"
                />
                <span className="font-medium">{choiceOptionLabel(field.key, option)}</span>
              </label>
            );
          })}
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </fieldset>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-2">
        <label htmlFor={`api-config-${field.key}`} className="text-sm font-medium text-foreground">
          {field.label}
        </label>
        {field.is_secret && field.is_set ? (
          cleared ? (
            <button
              type="button"
              onClick={onUndoClearSecret}
              disabled={disabled}
              className="shrink-0 text-xs font-medium text-primary hover:underline disabled:opacity-60"
            >
              Undo remove
            </button>
          ) : (
            <button
              type="button"
              onClick={onClearSecret}
              disabled={disabled}
              className="shrink-0 text-xs font-medium text-destructive hover:underline disabled:opacity-60"
            >
              Remove
            </button>
          )
        ) : null}
      </div>

      {field.description ? (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      ) : null}

      {isApifyDatePostedField(field.key) ? (
        <select
          id={`api-config-${field.key}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          {APIFY_INDEED_DATE_POSTED_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt} day{opt === "1" ? "" : "s"}
            </option>
          ))}
        </select>
      ) : field.is_secret ? (
        <div className="space-y-1">
          <div className="relative">
            <input
              id={`api-config-${field.key}`}
              type={secretVisible ? "text" : "password"}
              value={value}
              disabled={disabled || cleared}
              onChange={(e) => onChange(e.target.value)}
              autoComplete="new-password"
              placeholder={
                cleared
                  ? "Will be removed on save"
                  : secretConfigured
                    ? "••••••••  (configured — type to replace)"
                    : "Enter value"
              }
              className={cn(inputClass, "pr-10", cleared && "border-destructive/40")}
            />
            <button
              type="button"
              onClick={() => setSecretVisible((v) => !v)}
              disabled={disabled || cleared}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              aria-label={secretVisible ? `Hide ${field.label}` : `Show ${field.label}`}
              aria-pressed={secretVisible}
            >
              {secretVisible ? (
                <EyeOff className="size-4" strokeWidth={2} aria-hidden />
              ) : (
                <Eye className="size-4" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
          {secretConfigured && !value && !cleared ? (
            <p className="text-xs text-muted-foreground">
              Configured. Leave blank to keep the current value.
            </p>
          ) : null}
        </div>
      ) : field.value_type === "int" ? (
        <input
          id={`api-config-${field.key}`}
          type="number"
          value={value}
          disabled={disabled}
          min={constraints?.min}
          max={constraints?.max}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      ) : multilineQuery ? (
        <textarea
          id={`api-config-${field.key}`}
          value={value}
          disabled={disabled}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={textareaClass}
        />
      ) : (
        <input
          id={`api-config-${field.key}`}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
