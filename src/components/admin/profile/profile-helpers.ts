import type { ProfileResponse, ProfileUpdateRequest } from "@/types/profile";

/** Editable fields shared by Personal Information + Social Links. */
export type ProfileFormState = {
  full_name: string;
  email: string;
  country: string;
  city: string;
  zip_code: string;
  linkedin_url: string;
  twitter_url: string;
  github_url: string;
  portfolio_url: string;
};

export const EMPTY_PROFILE_FORM: ProfileFormState = {
  full_name: "",
  email: "",
  country: "",
  city: "",
  zip_code: "",
  linkedin_url: "",
  twitter_url: "",
  github_url: "",
  portfolio_url: "",
};

export function profileToFormState(profile: ProfileResponse): ProfileFormState {
  return {
    full_name: profile.full_name ?? "",
    email: profile.email ?? "",
    country: profile.country ?? "",
    city: profile.city ?? "",
    zip_code: profile.zip_code ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    twitter_url: profile.twitter_url ?? "",
    github_url: profile.github_url ?? "",
    portfolio_url: profile.portfolio_url ?? "",
  };
}

export function formsEqual(a: ProfileFormState, b: ProfileFormState): boolean {
  return (Object.keys(a) as (keyof ProfileFormState)[]).every((key) => a[key] === b[key]);
}

/**
 * Build a partial PATCH body containing only the keys whose value changed.
 * Optional fields cleared to an empty string are sent as `null` so the server
 * can persist the unset state.
 */
export function buildProfilePatch(
  state: ProfileFormState,
  original: ProfileFormState,
): ProfileUpdateRequest {
  const REQUIRED_KEYS = new Set<keyof ProfileFormState>(["full_name", "email"]);
  const patch: ProfileUpdateRequest = {};

  for (const key of Object.keys(state) as (keyof ProfileFormState)[]) {
    const next = state[key].trim();
    const prev = original[key].trim();
    if (next === prev) continue;
    if (REQUIRED_KEYS.has(key)) {
      patch[key] = next;
    } else {
      patch[key] = next === "" ? null : next;
    }
  }
  return patch;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;

export type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>;

export function validateProfileForm(state: ProfileFormState): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  if (state.full_name.trim().length === 0) {
    errors.full_name = "Full name is required.";
  } else if (state.full_name.trim().length > 120) {
    errors.full_name = "Full name must be 120 characters or fewer.";
  }
  if (state.email.trim().length === 0) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(state.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const urlFields: Array<[keyof ProfileFormState, string]> = [
    ["linkedin_url", "LinkedIn URL"],
    ["twitter_url", "Twitter / X URL"],
    ["github_url", "GitHub URL"],
    ["portfolio_url", "Portfolio URL"],
  ];
  for (const [key, label] of urlFields) {
    const v = state[key].trim();
    if (v.length > 0 && !URL_RE.test(v)) {
      errors[key] = `${label} must start with http:// or https://.`;
    }
  }
  return errors;
}

export function hasProfileFormErrors(errors: ProfileFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
