import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('storage')
export class StorageController {
  constructor(private readonly config: ConfigService) {}

  private get basePath(): string {
    return this.config.get<string>('app.storage.localPath', './uploads');
  }

  @Get(':context/:filename')
  @Public()
  serveFile(
    @Param('context') context: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Sanitize parameters to prevent path traversal
    const safeContext = path.basename(context);
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), this.basePath, safeContext, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }
}
