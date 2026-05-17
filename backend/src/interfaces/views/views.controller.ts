import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ViewService } from '../../application/views/view.service';
import { RecordViewDto } from './views.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Public } from '../../infrastructure/auth/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('property-views')
@Controller()
export class ViewsController {
  constructor(private readonly viewService: ViewService) {}

  @Public()
  @Post('properties/:id/view')
  @ApiOperation({ summary: 'Record a property view' })
  async recordView(
    @Param('id') id: string,
    @Body() dto: RecordViewDto,
    @Req() req: any,
  ) {
    return this.viewService.recordView(id, req.user?.id, dto.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('properties/:id/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get property view stats' })
  async getStats(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.viewService.getStats(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('properties/:id/stats/daily')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get daily view stats for last 30 days' })
  async getDailyStats(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.viewService.getDailyStats(id, req.user.id);
  }
}
