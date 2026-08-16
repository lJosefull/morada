import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { IUserRepository, USER_REPOSITORY } from '../../domain/users/user.repository';
import { IUser } from '../../domain/users/user.entity';
import { RegisterDto, LoginDto } from '../../interfaces/auth/auth.dto';
import { AltchaService } from '../../infrastructure/altcha/altcha.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MailService } from '../../infrastructure/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly altchaService: AltchaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const isValid = await this.altchaService.verifyPayload(registerDto.altcha);
    if (!isValid) {
      throw new ForbiddenException('Bot verification failed. Please try again.');
    }

    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      passwordHash: hashedPassword,
      emailVerified: false,
      verificationToken,
    });

    this.mailService.sendVerificationEmail(user.email, verificationToken).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        role: user.role,
        plan: user.plan,
        agencyName: user.agencyName,
        agencyLogo: user.agencyLogo,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const isValid = await this.altchaService.verifyPayload(loginDto.altcha);
    if (!isValid) {
      throw new ForbiddenException('Bot verification failed. Please try again.');
    }

    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Email not verified. Please verify your email before logging in.',
      );
    }

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        role: user.role,
        plan: user.plan,
        agencyName: user.agencyName,
        agencyLogo: user.agencyLogo,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      verificationToken: null,
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.userRepository.update(user.id, { verificationToken });
    await this.mailService.sendVerificationEmail(user.email, verificationToken).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    return { message: 'Verification email sent' };
  }

  async googleLogin(profile: { email: string; name: string; googleId: string; avatar?: string }) {
    let user = await this.userRepository.findByEmail(profile.email);
    if (user) {
      if (!user.googleId) {
        if (user.passwordHash && !user.emailVerified) {
          throw new ForbiddenException(
            'Email not verified. Please verify your email before linking a Google account.',
          );
        }
        const updateData: Record<string, unknown> = { googleId: profile.googleId };
        if (profile.avatar) updateData.avatar = profile.avatar;
        user = await this.userRepository.update(user.id, updateData as unknown as Partial<IUser>);
      }
    } else {
      user = await this.userRepository.create({
        email: profile.email,
        name: profile.name,
        googleId: profile.googleId,
        avatar: profile.avatar,
        passwordHash: '',
        emailVerified: true,
      });
    }

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        plan: user.plan,
        agencyName: user.agencyName,
        agencyLogo: user.agencyLogo,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!refreshSecret) {
        throw new UnauthorizedException('Refresh token secret not configured');
      }
      const payload = this.jwtService.verify<{ sub: string; email: string; role: string }>(
        refreshToken,
        { secret: refreshSecret },
      );

      const storedToken = await this.prisma.refreshToken.findFirst({
        where: { token: refreshToken, userId: payload.sub },
      });
      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (new Date() > storedToken.expiresAt) {
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new UnauthorizedException('Refresh token expired');
      }

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Rotate: delete old, create new
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      role: user.role,
      plan: user.plan,
      agencyName: user.agencyName,
      agencyLogo: user.agencyLogo,
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh token secret not configured');
    }
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    // Store refresh token in DB for validation/rotation
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
