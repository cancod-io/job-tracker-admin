import type { LucideIcon } from "lucide-react";
import { File, FileImage, FileText } from "lucide-react";
import type { AdminApplicationFile } from "@/types/admin-application-file";

const MAX_TEXT_PREVIEW_BYTES = 512 * 1024;

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

export function applicationFilePreviewKind(file: AdminApplicationFile): FilePreviewKind {
  return resolveFilePreviewKind(file.filename, file.content_type);
}

export function filenameFilePreviewKind(
  filename: string,
  contentType?: string | null,
): FilePreviewKind {
  return resolveFilePreviewKind(filename, contentType);
}

/** Every stored file can be opened in the preview modal. */
export function canPreviewApplicationFile(_file: AdminApplicationFile): boolean {
  return true;
}

export function canPreviewFilename(_filename: string, _contentType?: string | null): boolean {
  return true;
}

export type PreparedFilePreview = {
  kind: FilePreviewKind;
  url: string;
  text: string | null;
  html: string | null;
};

/** Build object URL (+ optional text/html body) for the shared preview modal. */
export async function prepareBlobFilePreview(
  blob: Blob,
  filename: string,
  contentType?: string | null,
): Promise<PreparedFilePreview> {
  if (isDocxFile(filename, contentType)) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const mammoth = await import("mammoth");
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      if (!html.trim()) {
        throw new Error("Document is empty.");
      }
      return { kind: "docx", url: "", text: null, html };
    } catch {
      return {
        kind: "embed",
        url: URL.createObjectURL(blob),
        text: null,
        html: null,
      };
    }
  }

  let kind = resolveFilePreviewKind(filename, contentType);
  const url = URL.createObjectURL(blob);
  let text: string | null = null;

  if (kind === "text") {
    try {
      if (blob.size > MAX_TEXT_PREVIEW_BYTES) {
        const slice = blob.slice(0, MAX_TEXT_PREVIEW_BYTES);
        text = `${await slice.text()}\n\n… preview truncated (${formatFileSize(blob.size)} total)`;
      } else {
        text = await blob.text();
      }
    } catch {
      kind = "embed";
    }
  }

  return { kind, url, text, html: null };
}
