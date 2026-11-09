import type { LucideIcon } from "lucide-react";
import { File, FileImage, FileText } from "lucide-react";

type NamedFile = {
  filename: string;
  content_type?: string | null;
};

const TEXT_EXTENSION_RE =
  /\.(txt|csv|md|json|xml|html?|css|js|mjs|cjs|ts|tsx|jsx|log|yaml|yml|svg|sql|env)$/i;

/** "12 B" / "4.2 KB" / "1.3 MB" — "—" for missing/invalid sizes. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Lucide icon matching the file's content type / extension. */
export function applicationFileIcon(file: NamedFile): LucideIcon {
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

export type FilePreviewKind = "image" | "pdf" | "text" | "video" | "audio" | "docx" | "embed";

/** @deprecated Use `FilePreviewKind`. */
export type ApplicationFilePreviewKind = FilePreviewKind;

/** Best inline preview renderer for a file. Unknown types use `embed` (iframe blob URL). */
export function resolveFilePreviewKind(
  filename: string,
  contentType?: string | null,
): FilePreviewKind {
  const type = contentType?.toLowerCase() ?? "";
  const name = filename.toLowerCase();

  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|ico|svg|avif)$/.test(name)) {
    return "image";
  }
  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (type.startsWith("video/") || /\.(mp4|webm|ogv|mov|m4v)$/.test(name)) {
    return "video";
  }
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/.test(name)) {
    return "audio";
  }
  if (
    type.startsWith("text/") ||
    type === "application/json" ||
    type === "application/xml" ||
    type === "application/javascript" ||
    TEXT_EXTENSION_RE.test(name)
  ) {
    return "text";
  }
  return "embed";
}

export function isDocxFile(filename: string, contentType?: string | null): boolean {
  const type = contentType?.toLowerCase() ?? "";
  const name = filename.toLowerCase();
  return (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

export function applicationFilePreviewKind(file: NamedFile): FilePreviewKind {
  return resolveFilePreviewKind(file.filename, file.content_type);
}

export function filenameFilePreviewKind(
  filename: string,
  contentType?: string | null,
): FilePreviewKind {
  return resolveFilePreviewKind(filename, contentType);
}

/** Every stored file can be opened in the preview modal. */
export function canPreviewApplicationFile(_file: NamedFile): boolean {
  return true;
}

export function canPreviewFilename(_filename: string, _contentType?: string | null): boolean {
  return true;
}

