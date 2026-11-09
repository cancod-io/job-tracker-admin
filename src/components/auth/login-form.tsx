"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fingerprint, Loader2 } from "lucide-react";
import {
  isFaceRequiredCode,
  isLoginAuthError,
  LOGIN_ERROR_CODES,
  type LoginField,
} from "@/lib/auth-errors";
import { verifyEmailHref } from "@/lib/auth-verification-api";
import { isPasskeyRequiredCode } from "@/lib/webauthn-api";
import { useAuth } from "@/providers/auth-provider";
import type { FaceDescriptor } from "@/types/face-auth";
import { cn } from "@/lib/utils";

const FaceCapturePanel = dynamic(
  () =>
    import("@/components/auth/face-capture-panel").then((m) => m.FaceCapturePanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card p-8 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
        Loading camera…
      </div>
    ),
  },
);

type InvalidFields = Partial<Record<LoginField, true>>;

function emptyInvalidFields(): InvalidFields {
  return {};
}

function LoginFormInner() {
  const { status, login, loginWithPasskey, loginWithFace } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/users";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<InvalidFields>(emptyInvalidFields);
  const [submitting, setSubmitting] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [faceSessionId, setFaceSessionId] = useState<string | null>(null);
  const [faceBusy, setFaceBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    }
  }, [status, router, nextPath]);

  function redirectAfterAuth() {
    router.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
  }

  function beginFaceStep(sessionId: string, message?: string) {
    setFaceSessionId(sessionId);
    setErrorCode(LOGIN_ERROR_CODES.FACE_REQUIRED);
    setError(message ?? "Face verification is required for this admin account.");
    setInvalidFields(emptyInvalidFields());
  }

  function applyCaughtError(err: unknown): boolean {
    if (isLoginAuthError(err) && isFaceRequiredCode(err.code) && err.faceSessionId) {
      beginFaceStep(err.faceSessionId, err.message);
      return true;
    }
    if (isLoginAuthError(err)) {
      const code = err.code ?? null;
      setErrorCode(code);
      setError(err.message);
      const fields = err.fields ?? [];
      if (fields.length > 0) {
        const next: InvalidFields = {};
        for (const field of fields) next[field] = true;
        setInvalidFields(next);
      }
      return false;
    }
    setErrorCode(null);
    setError(err instanceof Error ? err.message : "Sign-in failed");
    return false;
  }

  async function runPasskeyLogin(forEmail: string) {
    setPasskeyBusy(true);
    setError(null);
    setErrorCode(null);
    setInvalidFields(emptyInvalidFields());
    try {
      await loginWithPasskey(forEmail);
      redirectAfterAuth();
    } catch (err) {
      applyCaughtError(err);
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setInvalidFields(emptyInvalidFields());
    setFaceSessionId(null);
    if (!email.trim() || !password) {
      setError("Email or password is missing");
      setErrorCode(LOGIN_ERROR_CODES.LOGIN_FIELDS_MISSING);
      setInvalidFields({ email: true, password: true });
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      redirectAfterAuth();
    } catch (err) {
      if (isLoginAuthError(err) && err.code === LOGIN_ERROR_CODES.EMAIL_NOT_VERIFIED) {
        router.push(verifyEmailHref(email.trim()));
        return;
      }
      if (isLoginAuthError(err) && isPasskeyRequiredCode(err.code)) {
        setErrorCode(err.code ?? null);
        setError(err.message);
        setSubmitting(false);
        await runPasskeyLogin(email.trim());
        return;
      }
      applyCaughtError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function onPasskeyClick() {
    if (!email.trim()) {
      setError("Enter your email to sign in with a passkey.");
      setErrorCode(LOGIN_ERROR_CODES.LOGIN_FIELDS_MISSING);
      setInvalidFields({ email: true });
      return;
    }
    setFaceSessionId(null);
    await runPasskeyLogin(email.trim());
  }

  async function onFaceCaptured(descriptor: FaceDescriptor) {
    if (!faceSessionId) {
      setError("Face verification session is missing. Please sign in again.");
      setErrorCode(LOGIN_ERROR_CODES.FACE_SESSION_INVALID);
      setFaceSessionId(null);
      return;
    }
    setFaceBusy(true);
    setError(null);
    try {
      await loginWithFace(faceSessionId, descriptor);
      setFaceSessionId(null);
      redirectAfterAuth();
    } catch (err) {
      if (isLoginAuthError(err) && err.code === LOGIN_ERROR_CODES.FACE_SESSION_INVALID) {
        setFaceSessionId(null);
      }
      applyCaughtError(err);
      // Re-throw so FaceCapturePanel keeps showing the error locally too when needed.
      // Panel already sets its own message from thrown errors during capture;
      // verify errors are shown via applyCaughtError above.
    } finally {
      setFaceBusy(false);
    }
  }

  const busy = submitting || passkeyBusy || faceBusy;
  const showFaceStep = Boolean(faceSessionId);

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

  if (showFaceStep) {
    return (
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verify your face</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete face verification to finish signing in.
          </p>
        </div>
        {error && errorCode !== LOGIN_ERROR_CODES.FACE_REQUIRED ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <FaceCapturePanel
          title="Face check"
          description="Look at the camera, then capture when your face is centered."
          confirmLabel={faceBusy ? "Verifying…" : "Verify face"}
          disabled={faceBusy}
          onCaptured={onFaceCaptured}
          onCancel={() => {
            setFaceSessionId(null);
            setError(null);
            setErrorCode(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin sign in</h1>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
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
            autoComplete="username webauthn"
            required
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              if (invalidFields.email) {
                setInvalidFields((prev) => {
                  const next = { ...prev };
                  delete next.email;
                  return next;
                });
              }
            }}
            className="form-control w-full"
            disabled={busy}
            aria-invalid={invalidFields.email ? true : undefined}
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
            onChange={(ev) => {
              setPassword(ev.target.value);
              if (invalidFields.password) {
                setInvalidFields((prev) => {
                  const next = { ...prev };
                  delete next.password;
                  return next;
                });
              }
            }}
            className="form-control w-full"
            disabled={busy}
            aria-invalid={invalidFields.password ? true : undefined}
          />
        </div>

        {error ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              errorCode === "PENDING_APPROVAL" ||
                errorCode === "ACCOUNT_REJECTED" ||
                isPasskeyRequiredCode(errorCode) ||
                isFaceRequiredCode(errorCode)
                ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
            role="alert"
          >
            {error}
            {isPasskeyRequiredCode(errorCode) && passkeyBusy
              ? " Waiting for your authenticator…"
              : null}
          </p>
        ) : null}

        <button
          type="submit"
          className="hover:bg-primary/92 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors disabled:opacity-60"
          disabled={busy}
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

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-border/80" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onPasskeyClick()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          disabled={busy}
        >
          {passkeyBusy ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <Fingerprint className="size-4" aria-hidden />
          )}
          {passkeyBusy ? "Waiting for passkey…" : "Sign in with passkey"}
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
