import { formatFileSize } from "@/lib/admin-file-utils";

export { formatFileSize };

export const AVATAR_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_EXT_RE = /\.(jpe?g|png|gif|webp)$/i;

export function validateAvatarFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const okType = file.type.startsWith("image/") || AVATAR_EXT_RE.test(name);
  if (!okType) {
    return "Profile picture must be a JPG, PNG, GIF, or WEBP image.";
  }
  if (file.size <= 0) {
    return "Image file is empty.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return `Image must be ${formatFileSize(AVATAR_MAX_BYTES)} or smaller.`;
  }
  return null;
}
