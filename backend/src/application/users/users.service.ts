import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/users/user.repository';
import { IUser } from '../../domain/users/user.entity';
import {
  IPropertyRepository,
  PROPERTY_REPOSITORY,
} from '../../domain/properties/property.repository';
import { UpdateProfileDto, ChangePasswordDto } from '../../interfaces/users/users.dto';
import * as bcrypt from 'bcrypt';
import { unlink } from 'fs/promises';
import { validateImageMagicBytes } from '../../infrastructure/upload/multer.config';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async findById(id: string): Promise<IUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getPublicProfile(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [properties] = await this.propertyRepository.findMany({ userId: id });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      plan: user.plan,
      agencyName: user.agencyName,
      properties,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if changing email
    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatedUser = await this.userRepository.update(userId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.email && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone || null }),
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      plan: updatedUser.plan,
      agencyName: updatedUser.agencyName,
      agencyLogo: updatedUser.agencyLogo,
      createdAt: updatedUser.createdAt,
    };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!validateImageMagicBytes(file.path, file.mimetype)) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException('Invalid image file: content does not match image type');
    }
    const url = `/uploads/${file.filename}`;
    await this.userRepository.update(userId, { avatar: url } as any);
    return { avatar: url };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(userId, {
      passwordHash: newHashedPassword,
    });

    return { message: 'Password changed successfully' };
  }
}
