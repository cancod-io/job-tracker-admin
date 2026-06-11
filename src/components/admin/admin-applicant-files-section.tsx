"use client";

import { useState } from "react";
import { Eye, Paperclip, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date";
import {
  applicationFileIcon,
  canPreviewApplicationFile,
  formatFileSize,
} from "@/lib/admin-file-utils";
import { useAdminApplicationFiles } from "@/hooks/use-admin-application-files";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { AdminApplicationFilePreviewModal } from "@/components/admin/admin-application-file-preview-modal";
import { Spinner } from "@/components/ui/spinner";
import type { AdminApplicationFile } from "@/types/admin-application-file";

function FileRow({
  file,
  busy,
  canDelete,
  onPreview,
  onDelete,
}: {
  file: AdminApplicationFile;
  busy: boolean;
  canDelete: boolean;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const Icon = applicationFileIcon(file);
  const previewable = canPreviewApplicationFile(file);

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        {previewable ? (
          <button
            type="button"
            onClick={onPreview}
            className="block max-w-full truncate text-left text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
            title={`Preview ${file.filename}`}
          >
            {file.filename}
          </button>
        ) : (
          <p className="truncate text-sm font-medium text-foreground" title={file.filename}>
            {file.filename}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          {formatFileSize(file.size_bytes)}
          {file.created_at ? ` · ${formatDateTime(file.created_at)}` : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {previewable ? (
          <button
            type="button"
            onClick={onPreview}
            disabled={busy}
            className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
            aria-label={`Preview ${file.filename}`}
          >
            <Eye className="size-3.5" aria-hidden />
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md border border-destructive/30 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60",
            )}
            aria-label={`Delete ${file.filename}`}
          >
            {busy ? <Spinner className="size-3.5 border-destructive/30 border-t-destructive" /> : (
              <Trash2 className="size-3.5" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </li>
  );
}

/** Applicant attachments for the admin Jobs screen — preview + delete only. */
export function AdminApplicantFilesSection({ applicationId }: { applicationId: number }) {
  const { can } = useAdminPermissions();
  const canRead = can("applications.read");
  const canDelete = can("applications.delete");
  const { files, loading, loadError, deletingId, deleteError, deleteFile } =
    useAdminApplicationFiles(applicationId, { enabled: canRead });
  const [previewFile, setPreviewFile] = useState<AdminApplicationFile | null>(null);

  if (!canRead) {
    return (
      <p className="text-xs italic text-muted-foreground">
        You do not have permission to view application attachments.
      </p>
    );
  }

  async function handleDelete(file: AdminApplicationFile) {
    if (!window.confirm(`Delete “${file.filename}”? This permanently removes the file.`)) return;
    if (previewFile?.id === file.id) setPreviewFile(null);
    await deleteFile(file);
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Paperclip className="size-3.5 shrink-0" aria-hidden />
        Attachments{files.length > 0 ? ` (${files.length})` : ""}
      </p>

      {deleteError ? (
        <p className="text-xs text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-1.5" aria-busy="true" aria-label="Loading attachments">
          {[0, 1].map((key) => (
            <div key={key} className="h-12 animate-pulse rounded-lg border border-border/60 bg-muted/30" />
          ))}
        </div>
      ) : loadError ? (
        <p className="text-xs text-destructive" role="alert">
          {loadError}
        </p>
      ) : files.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">No files uploaded.</p>
      ) : (
        <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              busy={deletingId === file.id}
              canDelete={canDelete}
              onPreview={() => setPreviewFile(file)}
              onDelete={() => void handleDelete(file)}
            />
          ))}
        </ul>
      )}

      <AdminApplicationFilePreviewModal
        applicationId={applicationId}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
