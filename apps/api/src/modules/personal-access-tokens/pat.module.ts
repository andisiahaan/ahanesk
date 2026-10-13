import { Module } from '@nestjs/common';
import { PatController } from './pat.controller';
import { PatAdminController } from './pat.admin.controller';
import { PatService } from './pat.service';
import { PatRepository } from './pat.repository';

@Module({
  controllers: [PatController, PatAdminController],
  providers:   [PatService, PatRepository],
  exports:     [PatService],
})
export class PatModule {}
