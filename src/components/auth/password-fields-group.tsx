"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const MIN_PASSWORD_LENGTH = 8;

type PasswordFieldsGroupProps = {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  disabled?: boolean;
  showAllErrors?: boolean;
};

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function getPasswordLengthError(password: string, showWhenEmpty: boolean): string | null {
  if (password.length === 0) {
    return showWhenEmpty ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` : null;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

function getPasswordMatchError(
  password: string,
  confirm: string,
  showWhenEmpty: boolean,
): string | null {
  if (confirm.length === 0) {
    return showWhenEmpty ? "Passwords do not match." : null;
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}

export function PasswordFieldsGroup({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  disabled = false,
  showAllErrors = false,
}: PasswordFieldsGroupProps) {
  const [visible, setVisible] = useState(false);
  const inputType = visible ? "text" : "password";
  const lengthError = getPasswordLengthError(password, showAllErrors);
  const matchError = getPasswordMatchError(password, confirm, showAllErrors);
  const showLengthHint = password.length === 0 && !lengthError;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Password</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          aria-label={visible ? "Hide passwords" : "Show passwords"}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="size-4" strokeWidth={2} aria-hidden />
          ) : (
            <Eye className="size-4" strokeWidth={2} aria-hidden />
          )}
          <span>{visible ? "Hide" : "Show"}</span>
        </button>
      </div>

      <div className="space-y-2">
        <label htmlFor="reg-password" className="sr-only">
          Password
        </label>
        <input
          id="reg-password"
          name="password"
          type={inputType}
          autoComplete="new-password"
          required
          maxLength={128}
          value={password}
          onChange={(ev) => onPasswordChange(ev.target.value)}
          disabled={disabled}
          aria-invalid={lengthError ? true : undefined}
          aria-describedby={lengthError ? "reg-password-error" : undefined}
          className={cn("form-control w-full", lengthError && "border-destructive/70")}
        />
        {lengthError ? <FieldError id="reg-password-error" message={lengthError} /> : null}
        {showLengthHint ? (
          <p className="text-xs text-muted-foreground">
            Must be at least {MIN_PASSWORD_LENGTH} characters.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="reg-confirm" className="text-sm font-medium text-foreground">
          Confirm password
        </label>
        <input
          id="reg-confirm"
          name="confirm_password"
          type={inputType}
          autoComplete="new-password"
          required
          maxLength={128}
          value={confirm}
          onChange={(ev) => onConfirmChange(ev.target.value)}
          disabled={disabled}
          aria-invalid={matchError ? true : undefined}
          aria-describedby={matchError ? "reg-confirm-error" : undefined}
          className={cn("form-control w-full", matchError && "border-destructive/70")}
        />
        {matchError ? <FieldError id="reg-confirm-error" message={matchError} /> : null}
      </div>
    </div>
  );
}
