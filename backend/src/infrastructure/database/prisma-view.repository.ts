import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  IViewRepository,
  IDailyStatsRepository,
} from '../../domain/views/view.repository';
import {
  IPropertyView,
  IDailyPropertyStats,
  CreatePropertyViewInput,
} from '../../domain/views/view.entity';

@Injectable()
export class PrismaViewRepository implements IViewRepository {
  constructor(private prisma: PrismaService) {}

  async create(input: CreatePropertyViewInput): Promise<IPropertyView> {
    const view = await this.prisma.propertyView.create({
      data: {
        propertyId: input.propertyId,
        userId: input.userId ?? null,
        ip: input.ip ?? null,
      },
    });
    return {
      id: view.id,
      propertyId: view.propertyId,
      userId: view.userId,
      ip: view.ip,
      createdAt: view.createdAt,
    };
  }

  async countByPropertyId(propertyId: string): Promise<number> {
    return this.prisma.propertyView.count({ where: { propertyId } });
  }

  async countByUserAndProperty(userId: string, propertyId: string): Promise<number> {
    return this.prisma.propertyView.count({
      where: { userId, propertyId },
    });
  }

  async countByPropertySince(propertyId: string, since: Date): Promise<number> {
    return this.prisma.propertyView.count({
      where: { propertyId, createdAt: { gte: since } },
    });
  }

  async countInquiriesSince(propertyId: string, since: Date): Promise<number> {
    return this.prisma.inquiry.count({
      where: { propertyId, createdAt: { gte: since } },
    });
  }

  async countUniqueByPropertyId(propertyId: string): Promise<number> {
    // Count views where userId is distinct (non-null) + separate count by IP
    const [withUser, uniqueIps] = await Promise.all([
      this.prisma.propertyView.groupBy({
        by: ['userId'],
        where: { propertyId, userId: { not: null } },
        _count: { userId: true },
      }),
      this.prisma.propertyView.groupBy({
        by: ['ip'],
        where: { propertyId, ip: { not: null } },
        _count: { ip: true },
      }),
    ]);
    return withUser.length + uniqueIps.length;
  }
}

@Injectable()
export class PrismaDailyStatsRepository implements IDailyStatsRepository {
  constructor(private prisma: PrismaService) {}

  async upsertView(propertyId: string, date: Date, isUnique: boolean): Promise<void> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const existing = await this.prisma.dailyPropertyStats.findUnique({
      where: { propertyId_date: { propertyId, date: dateOnly } },
    });

    if (existing) {
      await this.prisma.dailyPropertyStats.update({
        where: { id: existing.id },
        data: {
          views: { increment: 1 },
          uniqueViews: isUnique ? { increment: 1 } : existing.uniqueViews,
        },
      });
    } else {
      await this.prisma.dailyPropertyStats.create({
        data: {
          propertyId,
          date: dateOnly,
          views: 1,
          uniqueViews: isUnique ? 1 : 0,
          inquiriesCount: 0,
        },
      });
    }
  }

  async upsertInquiry(propertyId: string, date: Date): Promise<void> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const existing = await this.prisma.dailyPropertyStats.findUnique({
      where: { propertyId_date: { propertyId, date: dateOnly } },
    });

    if (existing) {
      await this.prisma.dailyPropertyStats.update({
        where: { id: existing.id },
        data: { inquiriesCount: { increment: 1 } },
      });
    } else {
      await this.prisma.dailyPropertyStats.create({
        data: {
          propertyId,
          date: dateOnly,
          views: 0,
          uniqueViews: 0,
          inquiriesCount: 1,
        },
      });
    }
  }

  async findByPropertyId(propertyId: string, days = 30): Promise<IDailyPropertyStats[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const stats = await this.prisma.dailyPropertyStats.findMany({
      where: {
        propertyId,
        date: { gte: since },
      },
      orderBy: { date: 'desc' },
    });

    return stats.map((s) => ({
      id: s.id,
      propertyId: s.propertyId,
      date: s.date,
      views: s.views,
      uniqueViews: s.uniqueViews,
      inquiriesCount: s.inquiriesCount,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }
}
