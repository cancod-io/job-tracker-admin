import type { ApiConfigField } from "@/types/api-config-api";

export const APIFY_INDEED_DATE_POSTED_OPTIONS = ["1", "3", "7", "14"] as const;

type IntConstraint = { min: number; max: number };

const INT_CONSTRAINTS: Record<string, IntConstraint> = {
  SERPAPI_MAX_RESULTS: { min: 1, max: 100 },
  FANTASTIC_JOBS_LIMIT: { min: 1, max: 500 },
  FANTASTIC_JB_LIMIT: { min: 1, max: 500 },
  FANTASTIC_JOBS_DATE_POSTED_DAYS: { min: 1, max: 365 },
  FANTASTIC_JB_DATE_POSTED_DAYS: { min: 1, max: 365 },
  APIFY_INDEED_MAX_ITEMS: { min: 1, max: 1000 },
  APIFY_INDEED_TIMEOUT_SECS: { min: 30, max: 3600 },
};

export function isApifyDatePostedField(key: string): boolean {
  return key === "APIFY_INDEED_DATE_POSTED";
}

export function getIntConstraints(key: string): IntConstraint | null {
  return INT_CONSTRAINTS[key] ?? null;
}

export function fieldToFormValue(field: ApiConfigField): string {
  if (field.is_secret) return "";
  if (field.value_type === "bool") {
    return field.value === "true" ? "true" : "false";
  }
  return field.value ?? "";
}

export function validateFieldValue(field: ApiConfigField, value: string): string | null {
  if (isApifyDatePostedField(field.key)) {
    if (
      !APIFY_INDEED_DATE_POSTED_OPTIONS.includes(
        value as (typeof APIFY_INDEED_DATE_POSTED_OPTIONS)[number],
      )
    ) {
      return "Select 1, 3, 7, or 14 days.";
    }
    return null;
  }

  if (field.value_type === "int") {
    const trimmed = value.trim();
    if (!trimmed) return "This field is required.";
    const n = Number(trimmed);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return "Enter a whole number.";
    const constraints = getIntConstraints(field.key);
    if (constraints) {
      if (n < constraints.min || n > constraints.max) {
        return `Enter a number between ${constraints.min} and ${constraints.max}.`;
      }
    }
    return null;
  }

  if (field.value_type === "bool") {
    if (value !== "true" && value !== "false") return "Invalid boolean value.";
    return null;
  }

  if (field.value_type === "string" && !field.is_secret && field.is_set && !value.trim()) {
    return "This field is required.";
  }

  return null;
}

export function buildFormValuesFromConfig(
  groups: { fields: ApiConfigField[] }[],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const group of groups) {
    for (const field of group.fields) {
      values[field.key] = fieldToFormValue(field);
    }
  }
  return values;
}

export function buildPatchValues(
  fields: ApiConfigField[],
  formValues: Record<string, string>,
  initialValues: Record<string, string>,
  clearedKeys: Set<string>,
): Record<string, string | null> {
  const values: Record<string, string | null> = {};

  for (const field of fields) {
    const key = field.key;

    if (clearedKeys.has(key)) {
      values[key] = null;
      continue;
    }

    const current = formValues[key] ?? "";

    if (field.is_secret) {
      if (current.trim()) values[key] = current.trim();
      continue;
    }

    const initial = initialValues[key] ?? "";
    if (current !== initial) {
      values[key] = field.value_type === "int" ? String(Number(current.trim())) : current;
    }
  }

  return values;
}

export function groupHasChanges(
  fields: ApiConfigField[],
  formValues: Record<string, string>,
  initialValues: Record<string, string>,
  clearedKeys: Set<string>,
): boolean {
  return Object.keys(buildPatchValues(fields, formValues, initialValues, clearedKeys)).length > 0;
}
