import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../application/users/users.service';
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
}
