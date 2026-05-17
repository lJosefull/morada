import { Controller, Get, Patch, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../application/users/users.service';
import { UpdateProfileDto, ChangePasswordDto } from './users.dto';
import { Public } from '../../infrastructure/auth/public.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  @Patch('me')
  @ApiBearerAuth()
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req as any).user.id;
    return this.usersService.updateProfile(userId, dto);
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
