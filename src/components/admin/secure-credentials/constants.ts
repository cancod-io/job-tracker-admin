import type { CredentialType } from "@/types/secure-credentials";

export const CREDENTIAL_TYPE_OPTIONS: { value: CredentialType; label: string }[] = [
  { value: "pc_login", label: "PC Login" },
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook" },
  { value: "company_email", label: "Other Email" },
  { value: "two_fa_key", label: "2FA Key" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "anydesk", label: "AnyDesk" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

export const ACCOUNT_SLOT_TYPES: readonly CredentialType[] = [
  "gmail",
  "two_fa_key",
  "linkedin",
  "outlook",
  "company_email",
] as const;

export const ACCOUNT_SLOT_LABELS: Record<string, string> = {
  gmail: "Gmail",
  two_fa_key: "2FA Key",
  linkedin: "LinkedIn",
  outlook: "Outlook",
  company_email: "Other Email",
};

export const CREDENTIAL_TYPE_FILTER_OPTIONS: {
  value: CredentialType | "all";
  label: string;
}[] = [{ value: "all", label: "All types" }, ...CREDENTIAL_TYPE_OPTIONS];

export function formatCredentialType(type: CredentialType | string): string {
  if (type === "api_key") return "Other";
  return CREDENTIAL_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function isEmailCredentialType(type: CredentialType | string): boolean {
  return type === "gmail" || type === "outlook" || type === "company_email";
}

export function isTwoFaCredentialType(type: CredentialType | string): boolean {
  return type === "two_fa_key";
}

/** Soft accent classes per type for badges in the vault table. */
export function credentialTypeBadgeClass(type: CredentialType | string): string {
  switch (type) {
    case "pc_login":
      return "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "gmail":
      return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    case "outlook":
      return "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    case "company_email":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "two_fa_key":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
    case "linkedin":
      return "border-sky-600/25 bg-sky-600/10 text-sky-800 dark:text-sky-300";
    case "anydesk":
      return "border-orange-500/25 bg-orange-500/10 text-orange-800 dark:text-orange-300";
    case "whatsapp":
      return "border-green-500/25 bg-green-500/10 text-green-800 dark:text-green-300";
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
}

export function formatCredentialDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const CREDENTIALS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

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
  if (type === "linkedin") {
    return {
      label: "LinkedIn password",
      placeholderCreate: "Account password",
      placeholderEdit: "Leave blank to keep existing password",
      hint: "Store the LinkedIn login password. Put the profile URL in the URL/username field.",
    };
  }
  if (type === "anydesk") {
    return {
      label: "AnyDesk password",
      placeholderCreate: "Unattended access password",
      placeholderEdit: "Leave blank to keep existing password",
      hint: "ID/address goes in the identifier field; purpose can go in notes.",
    };
  }
  if (type === "pc_login") {
    return {
      label: "Password / PIN",
      placeholderCreate: "Password or PIN",
      placeholderEdit: "Leave blank to keep existing",
      hint: "PC username above; password or PIN here.",
    };
  }
  if (type === "gmail") {
    return {
      label: "Gmail password",
      placeholderCreate: "Gmail password or app password",
      placeholderEdit: "Leave blank to keep existing, or type a new Gmail password",
      hint: "Use an app password if 2-step verification is on for this Google account.",
    };
  }
  if (type === "outlook") {
    return {
      label: "Outlook password",
      placeholderCreate: "Outlook / Microsoft password",
      placeholderEdit: "Leave blank to keep existing, or type a new Outlook password",
      hint: "Microsoft account or mailbox password for Outlook / Microsoft 365.",
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
  return {
    label: "Password / Secret",
    placeholderCreate: "Required",
    placeholderEdit: "Leave blank to keep existing, or type a new secret",
    hint: "Any secret value for this entry.",
  };
}
