import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IPropertyRepository, PROPERTY_REPOSITORY } from '../../domain/properties/property.repository';
import {
  IViewRepository,
  VIEW_REPOSITORY,
  IDailyStatsRepository,
  DAILY_STATS_REPOSITORY,
} from '../../domain/views/view.repository';
import { CreatePropertyViewInput } from '../../domain/views/view.entity';

@Injectable()
export class ViewService {
  constructor(
    @Inject(VIEW_REPOSITORY)
    private readonly viewRepository: IViewRepository,
    @Inject(DAILY_STATS_REPOSITORY)
    private readonly dailyStatsRepository: IDailyStatsRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async recordView(propertyId: string, userId?: string, ip?: string) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    let isUnique = !userId
    if (userId) {
      const existing = await this.viewRepository.countByUserAndProperty(userId, propertyId)
      isUnique = existing === 0
    }

    const input: CreatePropertyViewInput = {
      propertyId,
      userId: userId || undefined,
      ip: ip || undefined,
    };

    const view = await this.viewRepository.create(input);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.dailyStatsRepository.upsertView(propertyId, today, isUnique);

    return view;
  }

  async getStats(propertyId: string, userId: string) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    if (property.userId !== userId) {
      throw new ForbiddenException('You can only view stats for your own properties');
    }

    const totalViews = await this.viewRepository.countByPropertyId(propertyId);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weeklyViews = await this.viewRepository.countByPropertySince(propertyId, weekAgo);

    const dailyStats = await this.dailyStatsRepository.findByPropertyId(propertyId, 30);
    const inquiryCount = dailyStats.reduce((sum, d) => sum + d.inquiriesCount, 0);

    return {
      totalViews,
      weeklyViews,
      inquiryCount,
    };
  }

  async getDailyStats(propertyId: string, userId: string) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    if (property.userId !== userId) {
      throw new ForbiddenException('You can only view stats for your own properties');
    }

    const stats = await this.dailyStatsRepository.findByPropertyId(propertyId, 30);
    return stats;
  }
}
