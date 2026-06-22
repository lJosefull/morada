import { Controller, Get, Patch, Post, Param, Body, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../application/users/users.service';
import { UpdateProfileDto, ChangePasswordDto } from './users.dto';
import { Public } from '../../infrastructure/auth/public.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UploadFile } from '../../infrastructure/upload/file-upload.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  async getProfile(@Req() req: Request) {
    const userId = (req as any).user.id;
    const user = await this.usersService.findById(userId);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      plan: user.plan,
      agencyName: user.agencyName,
      agencyLogo: user.agencyLogo,
      createdAt: user.createdAt,
    };
  }

  @Patch('me')
  @ApiBearerAuth()
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req as any).user.id;
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/avatar')
  @ApiBearerAuth()
  @UploadFile('avatar')
  async uploadAvatar(@Req() req: Request) {
    const userId = (req as any).user.id;
    const file = (req as any).file;
    return this.usersService.updateAvatar(userId, file);
  }

  @Patch('me/password')
  @ApiBearerAuth()
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const userId = (req as any).user.id;
    return this.usersService.changePassword(userId, dto);
  }

  @Public()
  @Get(':id/profile')
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
