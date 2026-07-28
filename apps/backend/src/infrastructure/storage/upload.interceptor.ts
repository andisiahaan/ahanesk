import { UseInterceptors, applyDecorators, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UPLOAD_CONFIGS } from '@ahansk/shared';
import type { UploadContext } from '@ahansk/shared';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export function StorageUploadInterceptor(context: UploadContext, multiple = false) {
  const config = UPLOAD_CONFIGS[context];
  
  if (!config) {
    throw new Error(`Upload config not found for context: ${context}`);
  }
  
  const multerOptions: MulterOptions = {
    limits: {
      fileSize: config.maxSizeBytes,
      files: config.maxFiles,
    },
    fileFilter: (req, file, cb) => {
      if (!config.allowedMimeTypes.includes(file.mimetype as any)) {
        return cb(new BadRequestException(`Tipe file tidak diizinkan. Tipe yang valid: ${config.allowedMimeTypes.join(', ')}`), false);
      }
      
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (!ext || !config.allowedExtensions.includes(`.${ext}` as any)) {
        return cb(new BadRequestException(`Ekstensi file tidak diizinkan. Ekstensi yang valid: ${config.allowedExtensions.join(', ')}`), false);
      }
      
      cb(null, true);
    },
  };

  if (multiple) {
    return applyDecorators(UseInterceptors(FilesInterceptor(config.fieldName, config.maxFiles, multerOptions)));
  } else {
    return applyDecorators(UseInterceptors(FileInterceptor(config.fieldName, multerOptions)));
  }
}
