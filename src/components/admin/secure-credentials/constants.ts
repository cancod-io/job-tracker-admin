import type { CredentialType } from "@/types/secure-credentials";

export const CREDENTIAL_TYPE_OPTIONS: { value: CredentialType; label: string }[] = [
  { value: "pc_login", label: "PC Login" },
  { value: "company_email", label: "Company Email" },
  { value: "two_fa_key", label: "2FA Key" },
  { value: "other", label: "Other" },
];

export const CREDENTIAL_TYPE_FILTER_OPTIONS: {
  value: CredentialType | "all";
  label: string;
}[] = [{ value: "all", label: "All types" }, ...CREDENTIAL_TYPE_OPTIONS];

export function formatCredentialType(type: CredentialType | string): string {
  if (type === "api_key") return "Other";
  return CREDENTIAL_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

/** Soft accent classes per type for badges in the vault table. */
export function credentialTypeBadgeClass(type: CredentialType | string): string {
  switch (type) {
    case "pc_login":
      return "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "company_email":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "two_fa_key":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
}

export function secretFieldCopy(type: CredentialType): {
  label: string;
  placeholderCreate: string;
  placeholderEdit: string;
  hint: string;
} {
  if (type === "two_fa_key") {
    return {
      label: "2FA secret / recovery key",
      placeholderCreate: "Authenticator secret or recovery codes",
      placeholderEdit: "Leave blank to keep existing, or type a new 2FA secret",
      hint: "Store the authenticator seed or recovery codes — not a one-time code from the app.",
    };
  }
  if (type === "company_email") {
    return {
      label: "Password",
      placeholderCreate: "Mailbox password",
      placeholderEdit: "Leave blank to keep existing, or type a new password",
      hint: "Email account password for this mailbox.",
    };
  }
  if (type === "pc_login") {
    return {
      label: "Password",
      placeholderCreate: "PC / workstation password",
      placeholderEdit: "Leave blank to keep existing, or type a new password",
      hint: "Login password for this machine or account.",
    };
  }
  return {
    label: "Password / Secret",
    placeholderCreate: "Required",
    placeholderEdit: "Leave blank to keep existing, or type a new secret",
    hint: "Any secret value for this entry.",
  };
}
