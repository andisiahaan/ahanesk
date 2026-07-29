import { createZodDto } from '../../common/utils/zod.dto';
import {
  RegisterSchema, LoginSchema, GoogleAuthSchema,
  ForgotPasswordSchema, ResetPasswordSchema,
  EnableTotpSchema, DisableTotpSchema, VerifyTotpSchema,
  RequestEmailChangeSchema, VerifyEmailChangeOtpSchema
} from '@ahanesk/shared';

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class GoogleAuthDto extends createZodDto(GoogleAuthSchema) {}
export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
export class EnableTotpDto extends createZodDto(EnableTotpSchema) {}
export class DisableTotpDto extends createZodDto(DisableTotpSchema) {}
export class VerifyTotpDto extends createZodDto(VerifyTotpSchema) {}
export class RequestEmailChangeDto extends createZodDto(RequestEmailChangeSchema) {}
export class VerifyEmailChangeOtpDto extends createZodDto(VerifyEmailChangeOtpSchema) {}
