/**
 * Upload config per context — SSOT tunggal untuk seluruh monorepo.
 *
 * Dipakai oleh:
 *  - Backend : filesystem.ts (DEFAULT_DISK), StorageService, drivers, modules
 *  - Frontend/Admin : validasi client-side, nama field FormData
 *
 * Field `disk` bersifat opsional — jika diisi, akan menimpa DEFAULT_DISK dari env.
 */

export interface UploadConfig {
  /** Form field name di multipart request. Frontend pakai ini saat append ke FormData. */
  fieldName: string;
  /** Subfolder di storage (local path prefix / S3 key prefix). */
  prefix: string;
  /** Override disk driver untuk context ini. Jika kosong, pakai DEFAULT_DISK dari env. */
  disk?: 'local' | 's3';
  /** Jumlah file maksimum per request. */
  maxFiles: number;
  /** Ukuran file maksimum per file dalam bytes. */
  maxSizeBytes: number;
  /** MIME type yang diizinkan. */
  allowedMimeTypes: readonly string[];
  /** Ekstensi yang diizinkan (termasuk titik, e.g. '.jpg'). */
  allowedExtensions: readonly string[];
}

export const UPLOAD_CONFIGS = {
  avatar: {
    fieldName:         'avatar',
    prefix:            'avatars',
    maxFiles:          1,
    maxSizeBytes:      2 * 1024 * 1024, // 2 MB
    allowedMimeTypes:  ['image/jpeg', 'image/png', 'image/webp'] as const,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'] as const,
  },
  blog_cover: {
    fieldName:         'cover_image',
    prefix:            'blog',
    maxFiles:          1,
    maxSizeBytes:      5 * 1024 * 1024, // 5 MB
    allowedMimeTypes:  ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const,
  },
  ticket_attachment: {
    fieldName:         'attachments',
    prefix:            'tickets',
    maxFiles:          5,
    maxSizeBytes:      10 * 1024 * 1024, // 10 MB per file
    allowedMimeTypes:  ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'] as const,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt'] as const,
  },
} as const satisfies Record<string, UploadConfig>;

export type UploadContext = keyof typeof UPLOAD_CONFIGS;
