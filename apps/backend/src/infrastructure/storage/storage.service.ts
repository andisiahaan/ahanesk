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

export interface StorageDriver {
  upload(file: UploadedFile, context: UploadContext): Promise<string>;
  delete(filePath: string): Promise<void>;
}

@Injectable()
export class StorageService {
  constructor(
    // ConfigService dipakai oleh LocalDriver & S3Driver untuk path/credentials.
    private readonly _config: ConfigService,
    private readonly localDriver: LocalDriver,
    private readonly s3Driver: S3Driver,
  ) {}

  /**
   * Pilih driver:
   *  1. UPLOAD_CONFIGS[context].disk jika diset (override per-context)
   *  2. DEFAULT_DISK dari env (global default)
   *
   * UPLOAD_CONFIGS adalah SSOT — bukan DISK_CONFIGS terpisah.
   */
  private resolveDriver(context: UploadContext): StorageDriver {
    const disk: DiskDriver = (UPLOAD_CONFIGS[context] as { disk?: DiskDriver }).disk ?? DEFAULT_DISK;
    return disk === 's3' ? this.s3Driver : this.localDriver;
  }

  async upload(file: UploadedFile, context: UploadContext): Promise<string> {
    return this.resolveDriver(context).upload(file, context);
  }

  async delete(filePath: string): Promise<void> {
    // Path relatif tidak membawa info disk — coba local dulu, fallback s3.
    await this.localDriver.delete(filePath).catch(() => this.s3Driver.delete(filePath));
  }
}
