import type { CredentialType } from "@/types/secure-credentials";

export const CREDENTIAL_TYPE_OPTIONS: { value: CredentialType; label: string }[] = [
  { value: "pc_login", label: "PC Login" },
  { value: "company_email", label: "Company Email" },
  { value: "api_key", label: "API Key" },
  { value: "other", label: "Other" },
];

export const CREDENTIAL_TYPE_FILTER_OPTIONS: {
  value: CredentialType | "all";
  label: string;
}[] = [{ value: "all", label: "All types" }, ...CREDENTIAL_TYPE_OPTIONS];

export function formatCredentialType(type: CredentialType): string {
  return CREDENTIAL_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
