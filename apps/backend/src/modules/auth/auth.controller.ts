import { Controller, Post, Get, Body, Query, Req, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthTotpService } from './auth-totp.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';


import { messages } from '@ahansk/shared';
import type { AuthUser } from '@ahansk/shared';
import {
  RegisterDto, LoginDto, GoogleAuthDto,
  ForgotPasswordDto, ResetPasswordDto,
  EnableTotpDto, DisableTotpDto, VerifyTotpDto,
  RequestEmailChangeDto, VerifyEmailChangeOtpDto,
} from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly totpService: AuthTotpService,
  ) {}

  @Public()
  @Post('register')
  @UseGuards(ThrottlerGuard)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ) {
    return this.authService.register(dto, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.googleAuth(dto, res, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTotp(
    @Body() dto: VerifyTotpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.totpService.verifyTotpLogin(dto, res, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.refresh_token as string | undefined;
    return this.authService.refresh(rawToken ?? '', res, req.ip, req.headers['user-agent']);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout(res);
    return { message: messages.auth.logoutSuccess };
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('2fa/setup')
  async setupTotp(@CurrentUser() user: AuthUser) {
    return this.totpService.setupTotp(user.id);
  }

  @Post('2fa/enable')
  async enableTotp(
    @CurrentUser() user: AuthUser,
    @Body() dto: EnableTotpDto,
  ) {
    return this.totpService.enableTotp(user.id, dto);
  }

  @Post('2fa/recovery-codes/regenerate')
  async regenerateRecoveryCodes(
    @CurrentUser() user: AuthUser,
    @Body() dto: DisableTotpDto,
  ) {
    return this.totpService.regenerateRecoveryCodes(user.id, dto);
  }

  @Post('2fa/disable')
  async disableTotp(
    @CurrentUser() user: AuthUser,
    @Body() dto: DisableTotpDto,
  ) {
    return this.totpService.disableTotp(user.id, dto);
  }

  @Post('email-change/request')
  async requestEmailChange(
    @CurrentUser() user: AuthUser,
    @Body() dto: RequestEmailChangeDto,
  ) {
    return this.authService.requestEmailChange(user.id, dto);
  }

  @Post('email-change/verify')
  async verifyEmailChange(
    @CurrentUser() user: AuthUser,
    @Body() dto: VerifyEmailChangeOtpDto,
  ) {
    return this.authService.verifyEmailChange(user.id, dto);
  }
}
