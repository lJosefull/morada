import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewsService } from '../../application/reviews/reviews.service';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto, SetReviewReplyDto, RemoveReviewReplyDto } from './reviews.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Public } from '../../infrastructure/auth/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('reviews')
@Controller('properties/:propertyId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all reviews for a property (paginated)' })
  async findAll(
    @Param('propertyId') propertyId: string,
    @Query() query: ReviewQueryDto,
  ) {
    const { page = 1, limit = 10 } = query;
    return this.reviewsService.findAll(propertyId, page, limit);
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get review stats for a property (average, distribution)' })
  async getStats(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getStats(propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a property (1 per user)' })
  async create(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: any,
  ) {
    return this.reviewsService.create(propertyId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my review for a property' })
  async update(
    @Param('propertyId') propertyId: string,
    @Body() dto: UpdateReviewDto,
    @Req() req: any,
  ) {
    return this.reviewsService.update(propertyId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete my review for a property' })
  async remove(
    @Param('propertyId') propertyId: string,
    @Req() req: any,
  ) {
    return this.reviewsService.remove(propertyId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my review for a property' })
  async getMyReview(
    @Param('propertyId') propertyId: string,
    @Req() req: any,
  ) {
    return this.reviewsService.getMyReview(propertyId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mine/reply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set owner reply to a review' })
  async setReply(
    @Body() dto: SetReviewReplyDto,
    @Req() req: any,
  ) {
    return this.reviewsService.setReply(dto.reviewId, req.user.id, dto.reply);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('mine/reply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove owner reply from a review' })
  async removeReply(
    @Body() dto: RemoveReviewReplyDto,
    @Req() req: any,
  ) {
    return this.reviewsService.removeReply(dto.reviewId, req.user.id);
  }
}
