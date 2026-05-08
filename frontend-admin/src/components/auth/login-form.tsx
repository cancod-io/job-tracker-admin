"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

function LoginFormInner() {
  const { status, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    }
  }, [status, router, nextPath]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    } catch (err) {
      const code =
        err instanceof Error ? (err as Error & { code?: string }).code ?? null : null;
      setErrorCode(code);
      setError(err instanceof Error ? err.message : "Sign-in failed");
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the same account as the API (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/v1/auth</code>
          ).
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8"
        noValidate
      >
        <div className="space-y-2">
          <label htmlFor="admin-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="admin-email"
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
          <label htmlFor="admin-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className="form-control w-full"
            disabled={submitting}
          />
        </div>

        {error ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              errorCode === "PENDING_APPROVAL" || errorCode === "ACCOUNT_REJECTED"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
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
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        Public job board:{" "}
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

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center text-muted-foreground">
          <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
