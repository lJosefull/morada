import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { IReviewRepository, REVIEW_REPOSITORY } from '../../domain/reviews/review.repository';
import {
  IPropertyRepository,
  PROPERTY_REPOSITORY,
} from '../../domain/properties/property.repository';
import { CreateReviewDto, UpdateReviewDto } from '../../interfaces/reviews/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async findAll(propertyId: string, page = 1, limit = 10) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const skip = (page - 1) * limit;
    const [data, total] = await this.reviewRepository.findByProperty(propertyId, skip, limit);

    return { data, total, page, limit };
  }

  async getStats(propertyId: string) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.reviewRepository.getStats(propertyId);
  }

  async create(propertyId: string, userId: string, dto: CreateReviewDto) {
    // Validate property exists
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Cannot review own property
    if (property.userId === userId) {
      throw new ForbiddenException('You cannot review your own property');
    }

    // Check if user already reviewed this property
    const existing = await this.reviewRepository.findByUserAndProperty(userId, propertyId);
    if (existing) {
      throw new ConflictException('You have already reviewed this property');
    }

    // Validate rating range
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Optional: validate user has contacted the seller
    // Uncomment the following lines to enable this validation:
    // const hasInquired = await this.reviewRepository.hasUserInquired(userId, propertyId);
    // if (!hasInquired) {
    //   throw new ForbiddenException('You must contact the seller before leaving a review');
    // }

    return this.reviewRepository.create({
      propertyId,
      userId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  async update(propertyId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.reviewRepository.findByUserAndProperty(userId, propertyId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.reviewRepository.update(review.id, {
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  async remove(propertyId: string, userId: string) {
    const review = await this.reviewRepository.findByUserAndProperty(userId, propertyId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepository.delete(review.id);
    return { deleted: true };
  }

  async getMyReview(propertyId: string, userId: string) {
    const review = await this.reviewRepository.findByUserAndProperty(userId, propertyId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  async setReply(reviewId: string, userId: string, reply: string) {
    // Get the review
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Get the property to verify ownership
    const property = await this.propertyRepository.findById(review.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Only the owner of the property can reply
    if (property.userId !== userId) {
      throw new ForbiddenException('Only the property owner can reply to reviews');
    }

    return this.reviewRepository.setReply(reviewId, reply);
  }

  async removeReply(reviewId: string, userId: string) {
    // Get the review
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Get the property to verify ownership
    const property = await this.propertyRepository.findById(review.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Only the owner of the property can remove their reply
    if (property.userId !== userId) {
      throw new ForbiddenException('Only the property owner can remove replies');
    }

    return this.reviewRepository.removeReply(reviewId);
  }
}
