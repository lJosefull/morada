import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InquiryService } from '../../application/inquiry/inquiry.service';
import { CreateInquiryDto, UpdateInquiryStatusDto, UpdateInquiryNotesDto } from './inquiry.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Public } from '../../infrastructure/auth/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('inquiries')
@Controller()
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Public()
  @Post('properties/:propertyId/inquiry')
  @ApiOperation({ summary: 'Submit an inquiry about a property' })
  async create(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateInquiryDto,
    @Req() req: any,
  ) {
    return this.inquiryService.create(propertyId, dto, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('inquiries/mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inquiries for my properties' })
  async findMine(
    @Req() req: any,
    @Query('status') status?: string,
  ) {
    return this.inquiryService.findMine(req.user.id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('inquiries/mine/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inquiry detail' })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.inquiryService.findOne(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inquiries/mine/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update inquiry status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryStatusDto,
    @Req() req: any,
  ) {
    return this.inquiryService.updateStatus(id, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('inquiries/mine/:id/notes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update inquiry notes' })
  async updateNotes(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryNotesDto,
    @Req() req: any,
  ) {
    return this.inquiryService.updateNotes(id, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('inquiries/my-history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my inquiry history as a buyer' })
  async findMyHistory(@Req() req: any) {
    return this.inquiryService.findMyHistory(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('inquiries/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inquiry stats for my properties' })
  async getStats(@Req() req: any) {
    return this.inquiryService.getStats(req.user.id);
  }
}
