"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { MIN_PASSWORD_LENGTH } from "@/components/auth/password-fields-group";
import { ProfileSectionCard } from "@/components/admin/profile/profile-section-card";
import { changePassword } from "@/lib/profile-api";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type FormState = {
  current: string;
  next: string;
  confirm: string;
};

const EMPTY: FormState = { current: "", next: "", confirm: "" };

function validate(state: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (state.current.length === 0) errors.current = "Current password is required.";
  if (state.next.length < MIN_PASSWORD_LENGTH) {
    errors.next = `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (state.next === state.current) {
    errors.next = "New password must be different from your current password.";
  }
  if (state.confirm !== state.next) {
    errors.confirm = "Passwords do not match.";
  }
  return errors;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold text-muted-foreground">
      {children}
    </label>
  );
}

type ChangePasswordSectionProps = {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function ChangePasswordSection({ onSuccess, onError }: ChangePasswordSectionProps) {
  const { accessToken } = useAuth();
  const [state, setState] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const errors = validate(state);
  const showErrors = submitted;
  const inputType = visible ? "text" : "password";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    if (!accessToken) return;

    setBusy(true);
    try {
      await changePassword(accessToken, {
        current_password: state.current,
        new_password: state.next,
      });
      onSuccess("Password updated.");
      setState(EMPTY);
      setSubmitted(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProfileSectionCard
      id="change-password"
      title="Change Password"
      description="Use at least 8 characters. We recommend a mix of letters, numbers, and symbols."
      action={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-pressed={visible}
          aria-label={visible ? "Hide passwords" : "Show passwords"}
        >
          {visible ? (
            <EyeOff className="size-3.5" aria-hidden />
          ) : (
            <Eye className="size-3.5" aria-hidden />
          )}
          {visible ? "Hide" : "Show"}
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="pw-current">Current Password</FieldLabel>
            <input
              id="pw-current"
              type={inputType}
              autoComplete="current-password"
              maxLength={128}
              value={state.current}
              onChange={(e) => setState((s) => ({ ...s, current: e.target.value }))}
              disabled={busy}
              aria-invalid={showErrors && errors.current ? true : undefined}
              className={cn("form-control w-full")}
              placeholder="Enter current password"
            />
            {showErrors && errors.current ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.current}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="pw-new">New Password</FieldLabel>
            <input
              id="pw-new"
              type={inputType}
              autoComplete="new-password"
              maxLength={128}
              value={state.next}
              onChange={(e) => setState((s) => ({ ...s, next: e.target.value }))}
              disabled={busy}
              aria-invalid={showErrors && errors.next ? true : undefined}
              className={cn("form-control w-full")}
              placeholder="Enter new password"
            />
            {showErrors && errors.next ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.next}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="pw-confirm">Confirm New Password</FieldLabel>
            <input
              id="pw-confirm"
              type={inputType}
              autoComplete="new-password"
              maxLength={128}
              value={state.confirm}
              onChange={(e) => setState((s) => ({ ...s, confirm: e.target.value }))}
              disabled={busy}
              aria-invalid={showErrors && errors.confirm ? true : undefined}
              className={cn("form-control w-full")}
              placeholder="Confirm new password"
            />
            {showErrors && errors.confirm ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.confirm}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Spinner className="size-4 text-primary" /> : null}
            Update Password
          </button>
        </div>
      </form>
    </ProfileSectionCard>
  );
}
