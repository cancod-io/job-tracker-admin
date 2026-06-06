"use client";

import { useEffect, useState } from "react";
import { fetchAdminApplicationFileBlob } from "@/lib/admin-application-files-api";
import { applicationFilePreviewKind, formatFileSize } from "@/lib/admin-file-utils";
import { useAuth } from "@/providers/auth-provider";
import { FilePreviewModal, type FilePreviewKind } from "@/components/ui/file-preview-modal";
import type { AdminApplicationFile } from "@/types/admin-application-file";

type AdminApplicationFilePreviewModalProps = {
  applicationId: number;
  file: AdminApplicationFile | null;
  onClose: () => void;
};

/**
 * Fetches an applicant's attachment (Bearer) and renders it in the shared
 * preview surface. Preview-only — no download affordance is exposed.
 */
export function AdminApplicationFilePreviewModal({
  applicationId,
  file,
  onClose,
}: AdminApplicationFilePreviewModalProps) {
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

    if (!file || !accessToken) {
      setLoading(false);
      setError(null);
      setPreviewKind(null);
      clearUrl();
      return;
    }

    const kind = applicationFilePreviewKind(file);
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
        const { blob } = await fetchAdminApplicationFileBlob(accessToken, applicationId, file);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not preview file.");
        setPreviewKind(null);
        clearUrl();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, applicationId, file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <FilePreviewModal
      open={Boolean(file)}
      title={file?.filename ?? ""}
      subtitle={file ? formatFileSize(file.size_bytes) : undefined}
      loading={loading}
      error={error}
      previewKind={previewKind}
      previewUrl={previewUrl}
      onClose={onClose}
    />
  );
}
