import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_EMAIL } from '@ahanesk/shared';
import { OtpService } from './otp.service';
import { OtpRepository } from './otp.repository';
import { EmailService } from '../../infrastructure/email/email.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_EMAIL }),
  ],
  providers: [OtpService, OtpRepository, EmailService],
  exports:   [OtpService],
})
export class OtpModule {}
