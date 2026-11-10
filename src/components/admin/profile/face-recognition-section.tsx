"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Loader2, ScanFace, Trash2 } from "lucide-react";
import { ProfileSectionCard } from "@/components/admin/profile/profile-section-card";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ConfirmDialogFooter } from "@/components/ui/confirm-dialog-footer";
import { Modal } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/format-date";
import { isAdminRole } from "@/lib/admin-permissions";
import { deleteFaceEnrollment, enrollFace, getFaceStatus } from "@/lib/face-auth-api";
import { isLoginAuthError, LOGIN_ERROR_CODES } from "@/lib/auth-errors";
import { useAuth } from "@/providers/auth-provider";
import type { FaceDescriptor } from "@/types/face-auth";
import type { FaceStatusResponse } from "@/types/face-auth";

const FaceCapturePanel = dynamic(
  () => import("@/components/auth/face-capture-panel").then((m) => m.FaceCapturePanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
        Loading camera…
      </div>
    ),
  },
);

type FaceRecognitionSectionProps = {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

export function FaceRecognitionSection({ onSuccess, onError }: FaceRecognitionSectionProps) {
  const { accessToken, user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const [status, setStatus] = useState<FaceStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [disabledByServer, setDisabledByServer] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !isAdmin) {
      setStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setDisabledByServer(false);
    try {
      const data = await getFaceStatus(accessToken);
      setStatus(data);
    } catch (e) {
      setStatus(null);
      const message = e instanceof Error ? e.message : "Could not load face status.";
      if (
        (isLoginAuthError(e) && e.code === LOGIN_ERROR_CODES.FACE_DISABLED) ||
        /face.?disabled|FACE_DISABLED/i.test(message)
      ) {
        setDisabledByServer(true);
        setLoadError("Face recognition is disabled on the server.");
      } else {
        setLoadError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleEnroll(descriptor: FaceDescriptor) {
    if (!accessToken) return;
    setEnrolling(true);
    try {
      const next = await enrollFace(accessToken, descriptor, label.trim() || null);
      setStatus(next);
      setLabel("");
      setEnrollOpen(false);
      onSuccess?.(status?.enrolled ? "Face template updated." : "Face enrolled.");
      await load();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not enroll face.");
      throw e;
    } finally {
      setEnrolling(false);
    }
  }

  async function handleRemove() {
    if (!accessToken) return;
    setRemoving(true);
    try {
      await deleteFaceEnrollment(accessToken);
      setConfirmRemove(false);
      onSuccess?.("Face enrollment removed.");
      await load();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not remove face enrollment.");
    } finally {
      setRemoving(false);
    }
  }

  if (!isAdmin) {
    return (
      <ProfileSectionCard
        id="face-recognition"
        title="Face recognition"
        description="Webcam soft-MFA for the administrator account."
      >
        <p className="text-sm text-muted-foreground">
          Only the admin account can enroll and manage face recognition.
        </p>
      </ProfileSectionCard>
    );
  }

  return (
    <>
      <ProfileSectionCard
        id="face-recognition"
        title="Face recognition"
        description="After enrollment, admin sign-in requires a webcam face check after password (and passkey, if enrolled)."
        action={
          !disabledByServer ? (
            <button
              type="button"
              onClick={() => setEnrollOpen(true)}
              disabled={loading || !accessToken || enrolling}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ScanFace className="size-4" aria-hidden />
              {status?.enrolled ? "Re-enroll face" : "Enroll face"}
            </button>
          ) : null
        }
      >
        <div className="space-y-4">
          {loadError ? <AlertBanner>{loadError}</AlertBanner> : null}

          {loading && !status ? (
            <div
              className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
              aria-busy="true"
            >
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              Loading face status…
            </div>
          ) : status?.enrolled ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {status.label?.trim() || "Face enrolled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Enrolled {formatDateTime(status.enrolled_at)}
                  {status.last_verified_at
                    ? ` · Last verified ${formatDateTime(status.last_verified_at)}`
                    : ""}
                  {status.face_required_on_login ? " · Required on login" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 sm:self-auto"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Remove
              </button>
            </div>
          ) : !disabledByServer ? (
            <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ScanFace className="size-5" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">No face enrolled</p>
              <p className="text-xs text-muted-foreground">
                Enroll a face template from your webcam. Requires HTTPS (or localhost) and camera
                permission.
              </p>
            </div>
          ) : null}
        </div>
      </ProfileSectionCard>

      {enrollOpen ? (
        <Modal
          aria-label={status?.enrolled ? "Re-enroll face" : "Enroll face"}
          title={status?.enrolled ? "Re-enroll face" : "Enroll face"}
          description="Capture a clear frontal face. This replaces any existing template."
          onClose={() => {
            if (!enrolling) setEnrollOpen(false);
          }}
          maxWidth="max-w-lg"
        >
          <div className="mb-4 space-y-1">
            <label htmlFor="face-label" className="text-sm font-medium text-foreground">
              Label <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="face-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={120}
              placeholder="e.g. Office webcam"
              disabled={enrolling}
              className="form-control w-full"
            />
          </div>
          <FaceCapturePanel
            title="Capture face"
            description="Center your face in the oval, then capture."
            confirmLabel={enrolling ? "Saving…" : status?.enrolled ? "Update face" : "Save face"}
            disabled={enrolling}
            onCaptured={handleEnroll}
            onCancel={() => {
              if (!enrolling) setEnrollOpen(false);
            }}
          />
        </Modal>
      ) : null}

      {confirmRemove ? (
        <Modal
          aria-label="Remove face enrollment confirmation"
          title="Remove face enrollment"
          onClose={() => {
            if (!removing) setConfirmRemove(false);
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-7" aria-hidden />
            </div>
            <p className="text-sm text-foreground">
              Remove the enrolled face template? Password/passkey login will no longer require face
              verification.
            </p>
          </div>
          <ConfirmDialogFooter
            error={null}
            busy={removing}
            onClose={() => setConfirmRemove(false)}
            onConfirm={() => void handleRemove()}
            confirmLabel="Remove"
            centered
          />
        </Modal>
      ) : null}
    </>
  );
}
