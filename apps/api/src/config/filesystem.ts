/**
 * Disk driver configuration — backend only.
 *
 * File ini HANYA bertanggung jawab untuk:
 *  - DEFAULT_DISK : driver global dari env DISK=local|s3 (divalidasi Zod di startup)
 *
 * Semua upload config (fieldName, prefix, constraints, disk override per-context)
 * ada di: packages/shared/src/upload-configs.ts → UPLOAD_CONFIGS
 */
import { UPLOAD_CONFIGS } from '@ahanesk/shared';
export { UPLOAD_CONFIGS };
export type { UploadContext } from '@ahanesk/shared';

export type DiskDriver = 'local' | 's3';

/** Driver disk global — dari env DISK=local|s3. */
export const DEFAULT_DISK: DiskDriver = (process.env['DISK'] ?? 'local') as DiskDriver;
