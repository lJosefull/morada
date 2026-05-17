import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FavoritesService } from '../../application/favorites/favorites.service';
import { ToggleFavoriteDto, CheckFavoritesDto } from './favorites.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('favorites')
@UseGuards(JwtAuthGuard)
@Controller('favorites')
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle a property as favorite' })
  async toggle(
    @Body() dto: ToggleFavoriteDto,
    @Req() req: any,
  ) {
    return this.favoritesService.toggle(req.user.id, dto.propertyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get my favorite properties' })
  async findAll(@Req() req: any) {
    return this.favoritesService.findAll(req.user.id);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check which properties are favorited' })
  @ApiQuery({
    name: 'propertyIds',
    description: 'Comma-separated property IDs',
    example: 'id1,id2,id3',
  })
  async check(
    @Req() req: any,
    @Query('propertyIds') propertyIds: string,
  ) {
    const ids = propertyIds.split(',').map((s: string) => s.trim()).filter(Boolean);
    return this.favoritesService.check(req.user.id, ids);
  }
}
