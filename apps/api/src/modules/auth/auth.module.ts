import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bullmq';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTotpService } from './auth-totp.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailService } from '../../infrastructure/email/email.service';
import { NotificationModule } from '../notifications/notification.module';
import { OtpModule } from '../otp/otp.module';
import { UsersModule } from '../users/users.module';
import { QUEUE_EMAIL } from '@ahanesk/shared';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    BullModule.registerQueue({ name: QUEUE_EMAIL }),
    NotificationModule,
    OtpModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthTotpService, AuthRepository, JwtStrategy, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
