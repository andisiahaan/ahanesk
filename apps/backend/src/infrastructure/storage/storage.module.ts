import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalDriver } from './drivers/local.driver';
import { S3Driver } from './drivers/s3.driver';

@Global()
@Module({
  providers: [StorageService, LocalDriver, S3Driver],
  exports: [StorageService],
})
export class StorageModule {}
