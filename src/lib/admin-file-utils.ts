import type { LucideIcon } from "lucide-react";
import { File, FileImage, FileText } from "lucide-react";
import type { AdminApplicationFile } from "@/types/admin-application-file";

/** "12 B" / "4.2 KB" / "1.3 MB" — "—" for missing/invalid sizes. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Lucide icon matching the file's content type / extension. */
export function applicationFileIcon(file: AdminApplicationFile): LucideIcon {
  const type = file.content_type?.toLowerCase() ?? "";
  const name = file.filename.toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) {
    return FileImage;
  }
  if (
    type.includes("pdf") ||
    name.endsWith(".pdf") ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    return FileText;
  }
  return File;
}

export type ApplicationFilePreviewKind = "image" | "pdf" | "none";

/** What the file can be previewed as inline, if anything. */
export function applicationFilePreviewKind(file: AdminApplicationFile): ApplicationFilePreviewKind {
  const type = file.content_type?.toLowerCase() ?? "";
  const name = file.filename.toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(name)) {
    return "image";
  }
  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }
  return "none";
}

export function canPreviewApplicationFile(file: AdminApplicationFile): boolean {
  return applicationFilePreviewKind(file) !== "none";
}

/** Preview kind inferred from filename (and optional MIME type). */
export function filenameFilePreviewKind(
  filename: string,
  contentType?: string | null,
): ApplicationFilePreviewKind {
  const type = contentType?.toLowerCase() ?? "";
  const name = filename.toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(name)) {
    return "image";
  }
  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }
  return "none";
}

export function canPreviewFilename(filename: string, contentType?: string | null): boolean {
  return filenameFilePreviewKind(filename, contentType) !== "none";
}
