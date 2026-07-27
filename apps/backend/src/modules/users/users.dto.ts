import { createZodDto } from '../../common/utils/zod.dto';
import {
  CreateUserSchema, UpdateUserSchema, UpdateProfileSchema, BanUserSchema, ChangePasswordSchema
} from '@ahansk/shared';

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
export class BanUserDto extends createZodDto(BanUserSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
