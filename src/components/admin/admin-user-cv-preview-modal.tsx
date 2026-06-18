"use client";

import { useEffect, useState } from "react";
import { fetchUserCvBlob } from "@/lib/admin-user-api";
import { formatFileSize, prepareBlobFilePreview } from "@/lib/admin-file-utils";
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
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<FilePreviewKind | null>(null);

  useEffect(() => {
    function clearPreview() {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPreviewText(null);
      setPreviewHtml(null);
      setPreviewKind(null);
    }

    if (!cv || userId == null || !accessToken) {
      setLoading(false);
      setError(null);
      clearPreview();
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    clearPreview();

    void (async () => {
      try {
        const blob = await fetchUserCvBlob(accessToken, userId, cv.id);
        if (cancelled) return;
        const prepared = await prepareBlobFilePreview(blob, cv.filename);
        if (cancelled) {
          URL.revokeObjectURL(prepared.url);
          return;
        }
        setPreviewKind(prepared.kind);
        setPreviewUrl(prepared.url || null);
        setPreviewText(prepared.text);
        setPreviewHtml(prepared.html);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not preview resume.");
        clearPreview();
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
      previewText={previewText}
      previewHtml={previewHtml}
      onDownload={onDownload}
      onClose={onClose}
    />
  );
}
