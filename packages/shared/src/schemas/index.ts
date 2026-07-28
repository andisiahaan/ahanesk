import { z, type ZodType } from 'zod';

// ─── API Response ─────────────────────────────────────────────────────────────
export const ApiSuccessSchema = <T extends ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.record(z.string(), z.array(z.string())).optional(),
});

export type ApiSuccess<T> = { success: true; message: string; data: T };
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  recaptchaToken: z.string().optional(),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  recaptchaToken: z.string().optional(),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const GoogleAuthSchema = z.object({
  credential: z.string().min(1),
});
export type GoogleAuthDto = z.infer<typeof GoogleAuthSchema>;

export const VerifyTotpSchema = z.object({
  partialToken: z.string().min(1),
  code: z.string().min(6).max(11),
});
export type VerifyTotpDto = z.infer<typeof VerifyTotpSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
  recaptchaToken: z.string().optional(),
});
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

export const EnableTotpSchema = z.object({
  code: z.string().length(6),
});
export type EnableTotpDto = z.infer<typeof EnableTotpSchema>;

export const DisableTotpSchema = z.object({
  password: z.string().min(1),
});
export type DisableTotpDto = z.infer<typeof DisableTotpSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).max(128),
});
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

// ─── Auth User (JWT payload shape) ───────────────────────────────────────────
export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['ADMIN', 'USER']),
  twoFactorEnabled: z.boolean(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

// ─── Users ────────────────────────────────────────────────────────────────────
export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(6).max(100).optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// ─── Settings ─────────────────────────────────────────────────────────────────
export const AppSettingsSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  meta_description: z.string().max(160).optional(),
  meta_keywords: z.string().max(255).optional(),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const UpdateSettingSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
});
export type UpdateSettingDto = z.infer<typeof UpdateSettingSchema>;

// ─── Pages ────────────────────────────────────────────────────────────────────
export const CreatePageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(255),
  content: z.string(),
  meta_description: z.string().max(160).optional(),
  is_published: z.boolean().default(false),
});
export type CreatePageDto = z.infer<typeof CreatePageSchema>;

export const UpdatePageSchema = CreatePageSchema.partial();
export type UpdatePageDto = z.infer<typeof UpdatePageSchema>;

// ─── OTP ──────────────────────────────────────────────────────────────────────
export const OTP_PURPOSES = [
  'email_change', 'phone_change', 'action_confirm', 'withdrawal',
] as const;
export type OTP_PURPOSE = (typeof OTP_PURPOSES)[number];

export const SendOtpSchema = z.object({
  purpose: z.enum(OTP_PURPOSES),
});
export type SendOtpDto = z.infer<typeof SendOtpSchema>;

// ─── Email Change ──────────────────────────────────────────────────────────────
export const RequestEmailChangeSchema = z.object({
  new_email: z.string().email(),
  password:  z.string().min(1),
});
export type RequestEmailChangeDto = z.infer<typeof RequestEmailChangeSchema>;

export const VerifyEmailChangeOtpSchema = z.object({
  new_email: z.string().email(),
  password:  z.string().min(1),
  otp:       z.string().length(6),
});
export type VerifyEmailChangeOtpDto = z.infer<typeof VerifyEmailChangeOtpSchema>;

// ─── Ban System ────────────────────────────────────────────────────────────────
export const BanUserSchema = z.object({
  reason:     z.string().min(1).max(1000),
  expires_at: z.string().datetime().optional(), // null = permanent
});
export type BanUserDto = z.infer<typeof BanUserSchema>;

// ─── Help Center ───────────────────────────────────────────────────────────────
const slugPattern = /^[a-z0-9-]+$/;

export const CreateHelpCategorySchema = z.object({
  slug:         z.string().min(1).max(100).regex(slugPattern),
  title:        z.string().min(1).max(255),
  description:  z.string().max(500).optional(),
  icon:         z.string().max(50).optional(),
  sort_order:   z.number().int().default(0),
  is_published: z.boolean().default(true),
});
export type CreateHelpCategoryDto = z.infer<typeof CreateHelpCategorySchema>;
export const UpdateHelpCategorySchema = CreateHelpCategorySchema.partial();
export type UpdateHelpCategoryDto = z.infer<typeof UpdateHelpCategorySchema>;

export const CreateHelpArticleSchema = z.object({
  category_id:      z.string().uuid(),
  slug:             z.string().min(1).max(255).regex(slugPattern),
  title:            z.string().min(1).max(255),
  content:          z.string().min(1),
  meta_description: z.string().max(160).optional(),
  sort_order:       z.number().int().default(0),
  is_published:     z.boolean().default(false),
});
export type CreateHelpArticleDto = z.infer<typeof CreateHelpArticleSchema>;
export const UpdateHelpArticleSchema = CreateHelpArticleSchema.partial();
export type UpdateHelpArticleDto = z.infer<typeof UpdateHelpArticleSchema>;

export const VoteHelpfulSchema = z.object({
  helpful: z.boolean(),
});
export type VoteHelpfulDto = z.infer<typeof VoteHelpfulSchema>;

// ─── Tickets ───────────────────────────────────────────────────────────────────
export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const TICKET_STATUSES   = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'] as const;

export const CreateTicketSchema = z.object({
  subject:     z.string().min(3).max(255),
  description: z.string().min(10),
  category:    z.string().max(100).optional(),
  priority:    z.enum(TICKET_PRIORITIES).default('MEDIUM'),
});
export type CreateTicketDto = z.infer<typeof CreateTicketSchema>;

export const CreateReplySchema = z.object({
  message: z.string().min(1),
});
export type CreateReplyDto = z.infer<typeof CreateReplySchema>;

// ─── Personal Access Tokens ────────────────────────────────────────────────────
export const CreatePatSchema = z.object({
  name:       z.string().min(1).max(100),
  expires_at: z.union([z.string().datetime(), z.literal('')]).optional().transform(v => v === '' ? undefined : v),
});
export type CreatePatDto = z.infer<typeof CreatePatSchema>;
