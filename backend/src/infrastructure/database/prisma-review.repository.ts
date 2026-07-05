import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IReviewRepository } from '../../domain/reviews/review.repository';
import {
  IReview,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewStats,
} from '../../domain/reviews/review.entity';

@Injectable()
export class PrismaReviewRepository implements IReviewRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<IReview | null> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
    if (!review) return null;
    return this.toDomain(review);
  }

  async findByProperty(propertyId: string, skip = 0, take = 10): Promise<[IReview[], number]> {
    const where = { propertyId };

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return [data.map((r) => this.toDomain(r)), total];
  }

  async findByUserAndProperty(userId: string, propertyId: string): Promise<IReview | null> {
    const review = await this.prisma.review.findUnique({
      where: {
        userId_propertyId: { userId, propertyId },
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
    if (!review) return null;
    return this.toDomain(review);
  }

  async create(input: CreateReviewInput): Promise<IReview> {
    const review = await this.prisma.review.create({
      data: {
        propertyId: input.propertyId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
    return this.toDomain(review);
  }

  async update(id: string, input: UpdateReviewInput): Promise<IReview> {
    const review = await this.prisma.review.update({
      where: { id },
      data: {
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.comment !== undefined && { comment: input.comment }),
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
    return this.toDomain(review);
  }

  async setReply(id: string, reply: string): Promise<IReview> {
    const review = await this.prisma.review.update({
      where: { id },
      data: {
        reply,
        replyDate: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
    return this.toDomain(review);
  }

  async removeReply(id: string): Promise<IReview> {
    const review = await this.prisma.review.update({
      where: { id },
      data: {
        reply: null,
        replyDate: null,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
    return this.toDomain(review);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.review.delete({ where: { id } });
  }

  async getStats(propertyId: string): Promise<ReviewStats> {
    const reviews = await this.prisma.review.findMany({
      where: { propertyId },
      select: { rating: true },
    });

    const total = reviews.length;
    if (total === 0) {
      return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of reviews) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      sum += r.rating;
    }

    const average = Math.round((sum / total) * 10) / 10;

    return { average, total, distribution };
  }

  async hasUserInquired(userId: string, propertyId: string): Promise<boolean> {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: {
        userId,
        propertyId,
      },
    });
    return inquiry !== null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(raw: any): IReview {
    return {
      id: raw.id,
      propertyId: raw.propertyId,
      userId: raw.userId,
      rating: raw.rating,
      comment: raw.comment,
      reply: raw.reply ?? null,
      replyDate: raw.replyDate ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      user: raw.user
        ? {
            id: raw.user.id,
            name: raw.user.name,
          }
        : undefined,
    };
  }
}
