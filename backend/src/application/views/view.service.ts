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

    const input: CreatePropertyViewInput = {
      propertyId,
      userId: userId || undefined,
      ip: ip || undefined,
    };

    const view = await this.viewRepository.create(input);

    // Check if this is a unique view from this user
    let isUnique = false;
    if (userId) {
      const countForUser = 1; // Just created this view, so count = 1 = unique
      isUnique = true;
    } else {
      // For anonymous views, we count all views as unique (per IP)
      isUnique = true;
    }

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
    const uniqueViews = await this.viewRepository.countUniqueByPropertyId(propertyId);

    return {
      totalViews,
      uniqueViews,
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
