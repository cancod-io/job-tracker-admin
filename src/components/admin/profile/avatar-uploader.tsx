"use client";

import { useRef, useState } from "react";
import { Camera, Trash2, UserRound } from "lucide-react";
import { AvatarEditorModal } from "@/components/admin/profile/avatar-editor-modal";
import { useAdminAvatarDisplayUrl } from "@/hooks/use-admin-avatar-display-url";
import { deleteAvatar, uploadAvatar } from "@/lib/profile-api";
import { hasProfileAvatar } from "@/lib/profile-avatar-url";
import {
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  formatFileSize,
  validateAvatarFile,
} from "@/lib/profile-file-utils";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type AvatarUploaderProps = {
  url: string | null;
  fallback: string;
  avatarRefreshKey: number;
  onAvatarChange: (url: string | null) => void;
  onAvatarRefresh: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function AvatarUploader({
  url,
  fallback,
  avatarRefreshKey,
  onAvatarChange,
  onAvatarRefresh,
  onSuccess,
  onError,
}: AvatarUploaderProps) {
  const { accessToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasAvatar = hasProfileAvatar(url);
  const { displayUrl: serverAvatarUrl, loading: avatarLoading } = useAdminAvatarDisplayUrl(
    accessToken ?? "",
    url,
    avatarRefreshKey,
  );

  function handlePick() {
    inputRef.current?.click();
  }

  function acceptCandidate(file: File | undefined | null) {
    if (!file) return;
    const err = validateAvatarFile(file);
    if (err) {
      onError(err);
      return;
    }
    setEditingFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    acceptCandidate(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (busy) return;
    acceptCandidate(e.dataTransfer.files?.[0]);
  }

  async function handleApplyCrop(cropped: File) {
    if (!accessToken) return;
    const preview = URL.createObjectURL(cropped);
    setLocalPreview(preview);
    setEditingFile(null);
    setBusy(true);

    try {
      const result = await uploadAvatar(accessToken, cropped);
      onAvatarChange(result.profile_picture_url);
      onAvatarRefresh();
      onSuccess("Profile picture updated.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not upload profile picture.");
    } finally {
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (busy || !accessToken) return;
    setBusy(true);
    try {
      await deleteAvatar(accessToken);
      onAvatarChange(null);
      onAvatarRefresh();
      onSuccess("Profile picture removed.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not remove profile picture.");
    } finally {
      setBusy(false);
    }
  }

  const shownUrl = localPreview ?? serverAvatarUrl;
  const showSpinner = busy || (hasAvatar && avatarLoading && !localPreview);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-foreground">Profile Picture</p>

      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        aria-label={hasAvatar ? "Change profile picture" : "Upload profile picture"}
        className={cn(
          "group relative size-28 overflow-hidden rounded-full border border-border bg-muted shadow-sm outline-none transition-shadow",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          dragActive && "border-primary ring-2 ring-primary",
          busy ? "cursor-not-allowed opacity-70" : "cursor-pointer",
        )}
      >
        {shownUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownUrl}
            alt="Profile avatar"
            className="size-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
            {fallback ? fallback : <UserRound className="size-10" aria-hidden />}
          </div>
        )}

        {!busy ? (
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/55 text-foreground opacity-0 transition-opacity group-hover:opacity-100",
              dragActive && "opacity-100",
            )}
          >
            <Camera className="size-5" aria-hidden />
            <span className="text-[11px] font-semibold">
              {dragActive ? "Drop to upload" : hasAvatar ? "Change" : "Upload"}
            </span>
          </div>
        ) : null}

        {showSpinner ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : null}
      </button>

      <div className="flex w-full max-w-[14rem] flex-col gap-2">
        <button
          type="button"
          onClick={handlePick}
          disabled={busy}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera className="size-3.5 shrink-0" aria-hidden />
          {hasAvatar ? "Change photo" : "Upload photo"}
        </button>
        {hasAvatar ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-background px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="size-3.5 shrink-0" aria-hidden />
            Remove
          </button>
        ) : null}
        <p className="text-center text-[11px] text-muted-foreground">
          Drag &amp; drop or click · JPG, PNG, GIF, WEBP · max {formatFileSize(AVATAR_MAX_BYTES)}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="sr-only"
        aria-label="Upload profile picture"
        onChange={handleFileChange}
      />

      {editingFile ? (
        <AvatarEditorModal
          file={editingFile}
          busy={busy}
          onApply={handleApplyCrop}
          onCancel={() => setEditingFile(null)}
          onChoosePhoto={handlePick}
          onError={onError}
        />
      ) : null}
    </div>
  );
}
