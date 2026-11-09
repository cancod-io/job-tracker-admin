"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  MIN_PASSWORD_LENGTH,
  PasswordFieldsGroup,
} from "@/components/auth/password-fields-group";
import { verifyEmailHref } from "@/lib/auth-verification-api";
import { useAuth } from "@/providers/auth-provider";

function RegisterFormInner() {
  const { status, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPasswordErrors, setShowPasswordErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    }
  }, [status, router, nextPath]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setShowPasswordErrors(true);
    if (password.length < MIN_PASSWORD_LENGTH || password !== confirm) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({ email, full_name: fullName.trim(), password });
      if (result.status === "needs_verification") {
        router.replace(verifyEmailHref(result.email));
        return;
      }
      if (result.status === "pending") {
        setPendingEmail(result.email);
        return;
      }
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingEmail) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pending approval</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{pendingEmail}</span> is queued for admin
            review. Another administrator must approve this account before you can open the console.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-6 text-sm text-amber-950 dark:text-amber-100 md:p-8">
          <p className="font-medium text-foreground">Need access right away?</p>
          <p className="mt-2 text-muted-foreground">
            Ask an existing admin to open <strong>Users</strong> and approve your account. You will
            not receive an API session until then.
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground" aria-busy="true">
        <Loader2 className="size-8 animate-spin motion-reduce:animate-none" />
        <p className="text-sm">Checking session…</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin motion-reduce:animate-none" />
        <p className="text-sm">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create admin account
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8"
        noValidate
      >
        <div className="space-y-2">
          <label htmlFor="admin-reg-name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            id="admin-reg-name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={200}
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
            className="form-control w-full"
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="admin-reg-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="admin-reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="form-control w-full"
            disabled={submitting}
          />
        </div>
        <PasswordFieldsGroup
          password={password}
          confirm={confirm}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirm}
          disabled={submitting}
          showAllErrors={showPasswordErrors}
        />

        {error ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="hover:bg-primary/92 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2
                className="mr-2 size-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center text-muted-foreground">
          <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
        </div>
      }
    >
      <RegisterFormInner />
    </Suspense>
  );
}
