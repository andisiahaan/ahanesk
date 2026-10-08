import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalDriver } from './drivers/local.driver';
import { S3Driver } from './drivers/s3.driver';
import { UPLOAD_CONFIGS, DEFAULT_DISK } from '../../config/filesystem';
import type { UploadContext } from '../../config/filesystem';
import type { DiskDriver } from '../../config/filesystem';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadOptions {
  disk?: DiskDriver;
}

export interface StorageDriver {
  upload(file: UploadedFile, context: UploadContext): Promise<string>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): string;
}

@Injectable()
export class StorageService {
  constructor(
    private readonly _config: ConfigService,
    private readonly localDriver: LocalDriver,
    private readonly s3Driver: S3Driver,
  ) {}

  /**
   * Pilih driver:
   *  1. overrideDisk jika dioper eksplisit saat pemanggilan
   *  2. UPLOAD_CONFIGS[context]?.disk jika diset (override per-context)
   *  3. DEFAULT_DISK dari env (global default)
   */
  private resolveDriver(context?: UploadContext, overrideDisk?: DiskDriver): StorageDriver {
    const disk: DiskDriver =
      overrideDisk ??
      (context ? (UPLOAD_CONFIGS[context] as { disk?: DiskDriver })?.disk : undefined) ??
      DEFAULT_DISK;
    return disk === 's3' ? this.s3Driver : this.localDriver;
  }

  async upload(file: UploadedFile, context: UploadContext, options?: UploadOptions): Promise<string> {
    return this.resolveDriver(context, options?.disk).upload(file, context);
  }

  async delete(filePath: string): Promise<void> {
    // Path relatif tidak membawa info disk — coba local dulu, fallback s3.
    await this.localDriver.delete(filePath).catch(() => this.s3Driver.delete(filePath));
  }

  getUrl(filePath: string, disk?: DiskDriver): string {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    return this.resolveDriver(undefined, disk).getUrl(filePath);
  }
}

