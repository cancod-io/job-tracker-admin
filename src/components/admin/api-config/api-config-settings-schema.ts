import { filterApiConfigSettingsGroups } from "@/components/admin/api-config/api-config-filters";
import type { ApiConfigField, ApiConfigGroup, ApiConfigValueType } from "@/types/api-config-api";

const FANTASTIC_TITLE_PLACEHOLDER =
  '"Shopify Developer" OR "Shopify Engineer" OR "Shopify Frontend Developer" OR "Shopify Plus Developer" OR "Shopify Theme Developer" OR "Shopify Liquid Developer" OR "Liquid Developer" OR "Headless Shopify Developer" OR "Shopify Hydrogen Developer" OR "Shopify App Developer"';

function field(
  key: string,
  label: string,
  value_type: ApiConfigValueType = "string",
  description?: string,
): ApiConfigField {
  return {
    key,
    label,
    description: description ?? null,
    value_type,
    is_secret: false,
    value: null,
    is_set: false,
  };
}

/** Recommended placeholders shown in empty settings fields. */
export const API_CONFIG_FIELD_PLACEHOLDERS: Record<string, string> = {
  FANTASTIC_JOBS_TIME_FRAME: "7d",
  FANTASTIC_JOBS_LIMIT: "100",
  FANTASTIC_JOBS_DATE_POSTED_DAYS: "15",
  FANTASTIC_JOBS_TITLE: FANTASTIC_TITLE_PLACEHOLDER,
  FANTASTIC_JOBS_TITLE_ADVANCED: FANTASTIC_TITLE_PLACEHOLDER,
  FANTASTIC_JOBS_WORK_ARRANGEMENT: "Remote OK,Remote Solely",
  FANTASTIC_JB_TIME_FRAME: "7d",
  FANTASTIC_JB_LIMIT: "100",
  FANTASTIC_JB_DATE_POSTED_DAYS: "15",
  FANTASTIC_JB_TITLE: FANTASTIC_TITLE_PLACEHOLDER,
  FANTASTIC_JB_TITLE_ADVANCED: FANTASTIC_TITLE_PLACEHOLDER,
  FANTASTIC_JB_WORK_ARRANGEMENT: "Remote OK,Remote Solely",
  FANTASTIC_JB_SOURCE: "wellfound,ycombinator",
  FANTASTIC_JB_EXCLUDE_ATS_DUPLICATE: "true",
};

export const FANTASTIC_ATS_SETTINGS_GROUP: ApiConfigGroup = {
  key: "fantastic_jobs",
  label: "Fantastic Jobs — ATS",
  description:
    "Active ATS (/active-ats) settings. Uses the Fantastic API key from the Keys tab (shared with Job Board).",
  fields: [
    field("FANTASTIC_JOBS_TIME_FRAME", "Time frame"),
    field("FANTASTIC_JOBS_LIMIT", "Limit", "int"),
    field("FANTASTIC_JOBS_DATE_POSTED_DAYS", "Date posted (days)", "int"),
    field("FANTASTIC_JOBS_TITLE", "Title query"),
    field(
      "FANTASTIC_JOBS_TITLE_ADVANCED",
      "Title query (advanced)",
      "string",
      "Optional alternate to Title when using advanced query syntax.",
    ),
    field("FANTASTIC_JOBS_WORK_ARRANGEMENT", "Work arrangement"),
    field("FANTASTIC_JOBS_LOCATION", "Location", "string", "Optional."),
    field("FANTASTIC_JOBS_DESCRIPTION", "Description filter", "string", "Optional."),
    field("FANTASTIC_JOBS_DESCRIPTION_FORMAT", "Description format", "string", "Optional."),
    field("FANTASTIC_JOBS_BASE_URL", "Base URL", "string", "Optional API base override."),
  ],
};

export const FANTASTIC_JB_SETTINGS_GROUP: ApiConfigGroup = {
  key: "fantastic_jb",
  label: "Fantastic Jobs — Job Board",
  description:
    "Job Board (/active-jb) settings. Wellfound + Y Combinator only — not LinkedIn. Same Fantastic API key as ATS.",
  fields: [
    field("FANTASTIC_JB_TIME_FRAME", "Time frame"),
    field("FANTASTIC_JB_LIMIT", "Limit", "int"),
    field("FANTASTIC_JB_DATE_POSTED_DAYS", "Date posted (days)", "int"),
    field("FANTASTIC_JB_TITLE", "Title query"),
    field(
      "FANTASTIC_JB_TITLE_ADVANCED",
      "Title query (advanced)",
      "string",
      "Optional alternate to Title when using advanced query syntax.",
    ),
    field(
      "FANTASTIC_JB_SOURCE",
      "Sources",
      "string",
      "Comma-separated job board sources. Use wellfound,ycombinator — LinkedIn is excluded.",
    ),
    field("FANTASTIC_JB_WORK_ARRANGEMENT", "Work arrangement"),
    field(
      "FANTASTIC_JB_EXCLUDE_ATS_DUPLICATE",
      "Exclude ATS duplicates",
      "bool",
      "Recommended true. Harmless for non-LinkedIn sources.",
    ),
    field("FANTASTIC_JB_LOCATION", "Location", "string", "Optional."),
    field("FANTASTIC_JB_DESCRIPTION", "Description filter", "string", "Optional."),
    field("FANTASTIC_JB_DESCRIPTION_FORMAT", "Description format", "string", "Optional."),
    field("FANTASTIC_JB_DIRECT_APPLY", "Direct apply", "string", "Optional."),
    field("FANTASTIC_JB_SENIORITY", "Seniority", "string", "Optional."),
    field("FANTASTIC_JB_ORGANIZATION_AGENCY", "Organization agency", "string", "Optional."),
    field(
      "FANTASTIC_JB_EXCLUDE_RECRUITER_FIELDS",
      "Exclude recruiter fields",
      "string",
      "Optional.",
    ),
    field("FANTASTIC_JB_BASE_URL", "Base URL", "string", "Optional API base override."),
  ],
};

const STATIC_FANTASTIC_GROUPS = [FANTASTIC_ATS_SETTINGS_GROUP, FANTASTIC_JB_SETTINGS_GROUP];

function isFantasticSettingsGroup(group: ApiConfigGroup): boolean {
  return (
    group.key === "fantastic_jobs" ||
    group.key === "fantastic_jb" ||
    group.fields.some(
      (f) => f.key.startsWith("FANTASTIC_JOBS_") || f.key.startsWith("FANTASTIC_JB_"),
    )
  );
}

function mergeGroupWithApi(template: ApiConfigGroup, fieldMap: Map<string, ApiConfigField>): ApiConfigGroup {
  const templateKeys = new Set(template.fields.map((f) => f.key));
  const mergedFields = template.fields.map((templateField) => {
    const fromApi = fieldMap.get(templateField.key);
    if (!fromApi) return templateField;
    return {
      ...templateField,
      ...fromApi,
      label: templateField.label,
      description: templateField.description ?? fromApi.description,
    };
  });

  const extraFromApi = [...fieldMap.values()].filter(
    (f) =>
      (f.key.startsWith("FANTASTIC_JOBS_") && template.key === "fantastic_jobs") ||
      (f.key.startsWith("FANTASTIC_JB_") && template.key === "fantastic_jb"),
  ).filter((f) => !templateKeys.has(f.key));

  return {
    ...template,
    fields: [...mergedFields, ...extraFromApi],
  };
}

/** Merge API settings with frontend Fantastic ATS / Job Board schema and ordering. */
export function mergeApiConfigSettingsGroups(apiGroups: ApiConfigGroup[]): ApiConfigGroup[] {
  const filtered = filterApiConfigSettingsGroups(apiGroups);
  const fieldMap = new Map<string, ApiConfigField>();
  for (const group of filtered) {
    for (const fieldItem of group.fields) {
      fieldMap.set(fieldItem.key, fieldItem);
    }
  }

  const passthrough = filtered.filter((g) => !isFantasticSettingsGroup(g));
  const mergedFantastic = STATIC_FANTASTIC_GROUPS.map((template) =>
    mergeGroupWithApi(template, fieldMap),
  );

  const serpapi = passthrough.find((g) => g.key === "serpapi");
  const rest = passthrough.filter((g) => g.key !== "serpapi");

  const ordered: ApiConfigGroup[] = [];
  if (serpapi) ordered.push(serpapi);
  ordered.push(...mergedFantastic, ...rest);
  return ordered;
}

export function getApiConfigFieldPlaceholder(key: string): string | undefined {
  return API_CONFIG_FIELD_PLACEHOLDERS[key];
}
