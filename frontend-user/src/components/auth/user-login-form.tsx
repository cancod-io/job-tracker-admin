"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

function UserLoginFormInner() {
  const { status, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground" aria-busy="true">
        <Loader2 className="size-8 animate-spin motion-reduce:animate-none" />
        <p className="text-sm">
          {status === "authenticated" ? "Redirecting…" : "Checking session…"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access saved jobs and application tracking with your account.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8"
        noValidate
      >
        <div className="space-y-2">
          <label htmlFor="user-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="user-email"
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
          <label htmlFor="user-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="user-password"
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
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to job board
        </Link>
        <span className="mx-2 text-border">·</span>
        <a
          href={`${process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "http://localhost:3001"}/login`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Admin console
        </a>
      </p>
    </div>
  );
}

export function UserLoginForm() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
        </div>
      }
    >
      <UserLoginFormInner />
    </Suspense>
  );
}
