/**
 * Attachment metadata for the admin Jobs screen.
 * Mirrors the backend `ApplicationFileResponse` schema from
 *   GET    /api/admin/applications/{application_id}/files
 *   GET    /api/admin/applications/{application_id}/files/{file_id}/download
 *   DELETE /api/admin/applications/{application_id}/files/{file_id}
 */
export type AdminApplicationFile = {
  id: number;
  application_id: number;
  filename: string;
  content_type?: string | null;
  size_bytes?: number | null;
  created_at?: string | null;
  download_url?: string | null;
};

export type AdminApplicationFileListResponse = {
  items: AdminApplicationFile[];
  total?: number;
};
