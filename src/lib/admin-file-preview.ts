import {
  formatFileSize,
  isDocxFile,
  resolveFilePreviewKind,
  type FilePreviewKind,
} from "@/lib/admin-file-utils";

const MAX_TEXT_PREVIEW_BYTES = 512 * 1024;

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
      // Keep mammoth out of pages that only import format helpers.
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
