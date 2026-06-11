"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteAdminApplicationFile,
  listAdminApplicationFiles,
} from "@/lib/admin-application-files-api";
import { useAuth } from "@/providers/auth-provider";
import type { AdminApplicationFile } from "@/types/admin-application-file";

type UseAdminApplicationFilesResult = {
  files: AdminApplicationFile[];
  loading: boolean;
  loadError: string | null;
  deletingId: number | null;
  deleteError: string | null;
  deleteFile: (file: AdminApplicationFile) => Promise<boolean>;
  reload: () => void;
};

/**
 * Loads an applicant's attachments for the admin Jobs screen and supports
 * deletion. Preview/download blobs are fetched on demand by the preview modal.
 */
export function useAdminApplicationFiles(
  applicationId: number,
  options?: { enabled?: boolean },
): UseAdminApplicationFilesResult {
  const enabled = options?.enabled ?? true;
  const { accessToken } = useAuth();

  const [files, setFiles] = useState<AdminApplicationFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !accessToken) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const items = await listAdminApplicationFiles(accessToken, applicationId);
      setFiles(items);
    } catch (e) {
      setFiles([]);
      setLoadError(e instanceof Error ? e.message : "Could not load attachments.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, applicationId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteFile = useCallback(
    async (file: AdminApplicationFile): Promise<boolean> => {
      if (!accessToken) return false;
      setDeletingId(file.id);
      setDeleteError(null);
      try {
        await deleteAdminApplicationFile(accessToken, applicationId, file.id);
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        return true;
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Could not delete file.");
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [accessToken, applicationId],
  );

  return {
    files,
    loading,
    loadError,
    deletingId,
    deleteError,
    deleteFile,
    reload: () => void load(),
  };
}
