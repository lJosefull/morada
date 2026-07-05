import { Controller, Get, Post, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { FollowService } from '../../application/follow/follow.service';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Public } from '../../infrastructure/auth/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('follow')
@Controller()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(JwtAuthGuard)
  @Post('follow/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle follow/unfollow a user' })
  async toggle(@Body() body: { userId: string }, @Req() req: any) {
    return this.followService.toggle(req.user.id, body.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('follow/check/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if I am following a user' })
  async check(@Param('userId') userId: string, @Req() req: any) {
    return this.followService.checkFollow(req.user.id, userId);
  }

  @Public()
  @Get('users/:userId/followers')
  @ApiOperation({ summary: 'Get followers of a user' })
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followService.getFollowers(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('users/:userId/following')
  @ApiOperation({ summary: 'Get who a user is following' })
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followService.getFollowing(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
