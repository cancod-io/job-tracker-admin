"use client";

import { useEffect, useState } from "react";
import { fetchUserCvBlob } from "@/lib/admin-user-api";
import { filenameFilePreviewKind, formatFileSize } from "@/lib/admin-file-utils";
import { useAuth } from "@/providers/auth-provider";
import { FilePreviewModal, type FilePreviewKind } from "@/components/ui/file-preview-modal";
import type { AdminUserCv } from "@/types/admin-user-api";

type AdminUserCvPreviewModalProps = {
  userId: number | null;
  cv: AdminUserCv | null;
  onClose: () => void;
  onDownload?: () => void;
};

export function AdminUserCvPreviewModal({
  userId,
  cv,
  onClose,
  onDownload,
}: AdminUserCvPreviewModalProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<FilePreviewKind | null>(null);

  useEffect(() => {
    function clearUrl() {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }

    if (!cv || userId == null || !accessToken) {
      setLoading(false);
      setError(null);
      setPreviewKind(null);
      clearUrl();
      return;
    }

    const kind = filenameFilePreviewKind(cv.filename);
    if (kind === "none") {
      setLoading(false);
      setError(null);
      setPreviewKind(null);
      clearUrl();
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreviewKind(kind);

    void (async () => {
      try {
        const blob = await fetchUserCvBlob(accessToken, userId, cv.id);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not preview resume.");
        setPreviewKind(null);
        clearUrl();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, userId, cv]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <FilePreviewModal
      open={Boolean(cv)}
      title={cv?.filename ?? ""}
      subtitle={cv?.file_size != null ? formatFileSize(cv.file_size) : undefined}
      loading={loading}
      error={error}
      previewKind={previewKind}
      previewUrl={previewUrl}
      unsupportedHint="This resume type can't be previewed in the browser. Use Download instead."
      onDownload={onDownload}
      onClose={onClose}
    />
  );
}
