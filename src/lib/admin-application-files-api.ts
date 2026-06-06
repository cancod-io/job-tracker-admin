/**
 * Client for application attachments on the admin Jobs screen.
 *
 * Endpoints (admin-scoped, proxied by Next.js Route Handlers):
 *   GET    /api/admin/applications/{application_id}/files
 *   POST   /api/admin/applications/{application_id}/files
 *   GET    /api/admin/applications/{application_id}/files/{file_id}
 *   DELETE /api/admin/applications/{application_id}/files/{file_id}
 *   GET    /api/admin/applications/{application_id}/files/{file_id}/download
 */
import { fetchAuthedJson, fetchAuthedResponse } from "@/lib/fetch-authed";
import type {
  AdminApplicationFile,
  AdminApplicationFileListResponse,
} from "@/types/admin-application-file";

const DOWNLOAD_TIMEOUT_MS = 60_000;

function base(applicationId: number): string {
  return `/api/admin/applications/${applicationId}/files`;
}

function normalizeFile(raw: AdminApplicationFile): AdminApplicationFile {
  return { ...raw, filename: raw.filename?.trim() || `file-${raw.id}` };
}

function parseFilesList(data: unknown): AdminApplicationFile[] {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeFile(item as AdminApplicationFile));
  }
  const wrapped = data as AdminApplicationFileListResponse;
  if (wrapped && Array.isArray(wrapped.items)) {
    return wrapped.items.map(normalizeFile);
  }
  return [];
}

export async function listAdminApplicationFiles(
  token: string,
  applicationId: number,
): Promise<AdminApplicationFile[]> {
  const data = await fetchAuthedJson<unknown>(token, base(applicationId));
  return parseFilesList(data);
}

export async function getAdminApplicationFile(
  token: string,
  applicationId: number,
  fileId: number,
): Promise<AdminApplicationFile> {
  const data = await fetchAuthedJson<AdminApplicationFile>(
    token,
    `${base(applicationId)}/${fileId}`,
  );
  return normalizeFile(data);
}

export async function uploadAdminApplicationFile(
  token: string,
  applicationId: number,
  file: File,
): Promise<AdminApplicationFile> {
  const form = new FormData();
  form.append("file", file, file.name);
  const data = await fetchAuthedJson<AdminApplicationFile>(token, base(applicationId), {
    method: "POST",
    body: form,
    timeoutMs: 60_000,
  });
  return normalizeFile(data);
}

export async function deleteAdminApplicationFile(
  token: string,
  applicationId: number,
  fileId: number,
): Promise<void> {
  await fetchAuthedJson<void>(token, `${base(applicationId)}/${fileId}`, { method: "DELETE" });
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1]?.trim() ?? null;
}

export type AdminApplicationFileBlob = {
  blob: Blob;
  contentType: string;
  filename: string;
};

/** Fetches the raw bytes (Bearer) so the preview modal can build an object URL. */
export async function fetchAdminApplicationFileBlob(
  token: string,
  applicationId: number,
  file: AdminApplicationFile,
): Promise<AdminApplicationFileBlob> {
  const res = await fetchAuthedResponse(token, `${base(applicationId)}/${file.id}/download`, {
    timeoutMs: DOWNLOAD_TIMEOUT_MS,
  });

  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() ||
    file.content_type?.split(";")[0]?.trim() ||
    "application/octet-stream";
  const filename =
    filenameFromContentDisposition(res.headers.get("content-disposition")) ?? file.filename;
  const blob = await res.blob();

  return {
    blob: blob.type ? blob : new Blob([await blob.arrayBuffer()], { type: contentType }),
    contentType,
    filename,
  };
}
