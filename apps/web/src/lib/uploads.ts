import { presignUpload, type PresignRequestMimeType } from '@digixsquad/api-client';
import {
  createHireRequestBodyAttachmentKeysMax,
  PresignUploadBody,
  presignUploadBodySizeBytesMax,
  PresignUploadResponse,
} from '@digixsquad/api-client/zod';

export const MAX_FILES = createHireRequestBodyAttachmentKeysMax;
export const MAX_BYTES = presignUploadBodySizeBytesMax;
export const ALLOWED_MIME = PresignUploadBody.shape.mime_type.options;
export const ACCEPT = '.pdf,.doc,.docx,' + ALLOWED_MIME.join(',');

const EXT_MIME: Record<string, PresignRequestMimeType> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Browsers sometimes report '' for .doc/.docx: fall back to the extension. */
export function mimeOf(file: File): PresignRequestMimeType | null {
  if ((ALLOWED_MIME as readonly string[]).includes(file.type))
    return file.type as PresignRequestMimeType;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MIME[ext] ?? null;
}

export const formatBytes = (n: number) =>
  n < 1024 * 1024
    ? `${Math.max(1, Math.round(n / 1024))} KB`
    : `${(n / 1024 / 1024).toFixed(1)} MB`;

/** Returns an error message, or null if the file can be uploaded. */
export function checkFile(file: File): string | null {
  if (!mimeOf(file)) return `${file.name}: only PDF, DOC or DOCX files.`;
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > MAX_BYTES) return `${file.name} is larger than ${formatBytes(MAX_BYTES)}.`;
  return null;
}

/** Presign → PUT straight to private storage. Returns the storage key for the request. */
export async function uploadFile(file: File, signal?: AbortSignal): Promise<string> {
  const mime_type = mimeOf(file)!;
  const res0 = await presignUpload(
    { file_name: file.name.slice(0, 200), mime_type, size_bytes: file.size },
    { signal },
  );
  const data = PresignUploadResponse.parse(res0.data);
  const res = await fetch(data.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': mime_type },
    body: file,
    signal,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return data.file_key;
}
