import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type { StorageDriver, UploadedFile } from '../storage.service';
import type { UploadContext } from '../../../config/filesystem';
import { UPLOAD_CONFIGS } from '../../../config/filesystem';

@Injectable()
export class LocalDriver implements StorageDriver {
  constructor(private readonly config: ConfigService) {}

  private get basePath(): string {
    return this.config.get<string>('app.storage.localPath', './uploads');
  }

  async upload(file: UploadedFile, context: UploadContext): Promise<string> {
    const { prefix } = UPLOAD_CONFIGS[context];
    const ext        = path.extname(file.originalname).toLowerCase();
    const filename   = `${crypto.randomUUID()}${ext}`;
    const dir        = path.join(this.basePath, prefix);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), file.buffer);

    return `${prefix}/${filename}`;
  }

  async delete(filePath: string): Promise<void> {
    await fs.rm(path.join(this.basePath, filePath), { force: true });
  }
}
