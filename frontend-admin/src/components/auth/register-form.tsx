"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    }
  }, [status, router, nextPath]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ email, full_name: fullName.trim(), password });
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
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
        <p className="mt-2 text-sm text-muted-foreground">
          Uses the same API as sign-in (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /api/v1/auth/register</code>
          ). You will be signed in after registration.
        </p>
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
        <div className="space-y-2">
          <label htmlFor="admin-reg-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="admin-reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className="form-control w-full"
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="admin-reg-confirm" className="text-sm font-medium text-foreground">
            Confirm password
          </label>
          <input
            id="admin-reg-confirm"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(ev) => setConfirm(ev.target.value)}
            className="form-control w-full"
            disabled={submitting}
          />
        </div>

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

      <p className="text-center text-xs text-muted-foreground">
        <a
          href={process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000"}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Open main app
        </a>
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
