import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from '../../application/auth/auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './auth.dto';
import { AltchaService } from '../../infrastructure/altcha/altcha.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { GoogleAuthGuard } from '../../infrastructure/auth/google-auth.guard';
import { Public } from '../../infrastructure/auth/public.decorator';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly altchaService: AltchaService,
  ) {}

  @Public()
  @Post('register')
  @SkipThrottle({ short: true, medium: true })
  @Throttle({ long: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @SkipThrottle({ short: true, medium: true })
  @Throttle({ long: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @SkipThrottle({ short: true, medium: true })
  @Throttle({ long: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Public()
  @Post('verify-email')
  @SkipThrottle({ short: true, medium: true })
  @Throttle({ long: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify email with token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @SkipThrottle({ short: true, medium: true })
  @Throttle({ long: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Resend verification email' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Login with Google' })
  async googleAuth() {}

  @Public()
  @Get('altcha-challenge')
  @ApiOperation({ summary: 'Get Altcha challenge for bot protection' })
  async getAltchaChallenge() {
    return this.altchaService.generateChallenge();
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiExcludeEndpoint()
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    try {
      const result = await this.authService.googleLogin(req.user);
      res.redirect(
        `${frontendUrl}/auth/callback#accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } catch {
      res.redirect(`${frontendUrl}/auth/callback#error=google_login_failed`);
    }
  }
}
