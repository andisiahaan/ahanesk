import { Module } from '@nestjs/common';
import { HelpService } from './help.service';
import { HelpRepository } from './help.repository';
import { HelpController } from './help.controller';
import { HelpAdminController } from './help.admin.controller';

@Module({
  controllers: [HelpController, HelpAdminController],
  providers:   [HelpService, HelpRepository],
  exports:     [HelpService],
})
export class HelpModule {}
