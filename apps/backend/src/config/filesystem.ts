/**
 * Disk driver configuration — backend only.
 *
 * File ini HANYA bertanggung jawab untuk:
 *  - DEFAULT_DISK : driver global dari env DISK=local|s3 (divalidasi Zod di startup)
 *
 * Semua upload config (fieldName, prefix, constraints, disk override per-context)
 * ada di: packages/shared/src/upload-configs.ts → UPLOAD_CONFIGS
 */
import { UPLOAD_CONFIGS } from '@ahansk/shared';
export { UPLOAD_CONFIGS };
export type { UploadContext } from '@ahansk/shared';

export type DiskDriver = 'local' | 's3';

/** Driver disk global — dari env DISK=local|s3. */
export const DEFAULT_DISK: DiskDriver = (process.env['DISK'] ?? 'local') as DiskDriver;
