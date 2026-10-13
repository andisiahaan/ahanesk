import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { StorageDriver, UploadedFile } from '../storage.service';
import type { UploadContext } from '../../../config/filesystem';
import { UPLOAD_CONFIGS } from '../../../config/filesystem';

@Injectable()
export class LocalDriver implements StorageDriver {
  constructor(private readonly config: ConfigService) {}

  private get basePath(): string {
    const configured = this.config.get<string>('app.storage.localPath', '../../storage');
    if (path.isAbsolute(configured)) return configured;

    // Cari root monorepo (direktori yang memiliki pnpm-workspace.yaml)
    let curr = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (fsSync.existsSync(path.join(curr, 'pnpm-workspace.yaml'))) {
        return path.resolve(curr, 'storage');
      }
      const parent = path.dirname(curr);
      if (parent === curr) break;
      curr = parent;
    }

    return path.resolve(process.cwd(), configured);
  }

  getUrl(filePath: string): string {
    const baseUrl = this.config.get<string>('app.storage.url', 'http://ahansk.test/storage').replace(/\/$/, '');
    const clean = filePath.replace(/^\//, '');
    return `${baseUrl}/${clean}`;
  }

  async upload(file: UploadedFile, context: UploadContext): Promise<string> {
    const { prefix } = UPLOAD_CONFIGS[context];
    const ext        = path.extname(file.originalname).toLowerCase();
    const filename   = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const dir        = path.join(this.basePath, prefix);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), file.buffer);

    return `${prefix}/${filename}`;
  }

  async delete(filePath: string): Promise<void> {
    await fs.rm(path.join(this.basePath, filePath), { force: true });
  }
}

