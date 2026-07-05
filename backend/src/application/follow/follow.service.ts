import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new NotFoundException('Cannot follow yourself');
    }

    const target = await this.prisma.user.findUnique({ where: { id: followingId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      await this.prisma.userFollow.delete({ where: { id: existing.id } });
      return { following: false };
    }

    await this.prisma.userFollow.create({
      data: { followerId, followingId },
    });

    // Create notification for the followed user
    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: { name: true },
    });

    await this.prisma.notification
      .create({
        data: {
          userId: followingId,
          type: 'follow',
          title: 'New follower',
          message: `${follower?.name || 'Someone'} started following you`,
          link: `/agents/${followerId}`,
        },
      })
      .catch((err) => console.error('Failed to create notification:', err));

    return { following: true };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followingId: userId },
        include: { follower: { select: { id: true, name: true, email: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userFollow.count({ where: { followingId: userId } }),
    ]);
    return {
      data: data.map((f) => ({ ...f.follower, followedAt: f.createdAt })),
      total,
      page,
      limit,
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followerId: userId },
        include: { following: { select: { id: true, name: true, email: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userFollow.count({ where: { followerId: userId } }),
    ]);
    return {
      data: data.map((f) => ({ ...f.following, followedAt: f.createdAt })),
      total,
      page,
      limit,
    };
  }

  async checkFollow(followerId: string, followingId: string) {
    const existing = await this.prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { following: !!existing };
  }
}
