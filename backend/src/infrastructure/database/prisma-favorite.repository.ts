import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IFavoriteRepository } from '../../domain/favorites/favorite.repository';
import { IFavorite, FavoriteWithProperty } from '../../domain/favorites/favorite.entity';

@Injectable()
export class PrismaFavoriteRepository implements IFavoriteRepository {
  constructor(private prisma: PrismaService) {}

  async findByUserId(
    userId: string,
    skip = 0,
    take = 20,
  ): Promise<[FavoriteWithProperty[], number]> {
    const [data, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { property: { include: { images: true } } },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    const mapped = data.map((f) => this.toDomainWithProperty(f));
    return [mapped, total];
  }

  async findByUserAndProperty(userId: string, propertyId: string): Promise<IFavorite | null> {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
    if (!fav) return null;
    return this.toDomain(fav);
  }

  async findByUserAndPropertyIds(userId: string, propertyIds: string[]): Promise<IFavorite[]> {
    const favs = await this.prisma.favorite.findMany({
      where: {
        userId,
        propertyId: { in: propertyIds },
      },
    });
    return favs.map((f) => this.toDomain(f));
  }

  async create(userId: string, propertyId: string): Promise<IFavorite> {
    const fav = await this.prisma.favorite.create({
      data: { userId, propertyId },
    });
    return this.toDomain(fav);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.favorite.delete({ where: { id } });
  }

  async countByPropertyId(propertyId: string): Promise<number> {
    return this.prisma.favorite.count({ where: { propertyId } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(raw: any): IFavorite {
    return {
      id: raw.id,
      userId: raw.userId,
      propertyId: raw.propertyId,
      createdAt: raw.createdAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomainWithProperty(raw: any): FavoriteWithProperty {
    return {
      id: raw.id,
      userId: raw.userId,
      propertyId: raw.propertyId,
      createdAt: raw.createdAt,
      property: {
        id: raw.property.id,
        title: raw.property.title,
        description: raw.property.description,
        price: raw.property.price,
        currency: raw.property.currency,
        propertyType: raw.property.propertyType,
        listingType: raw.property.listingType,
        bedrooms: raw.property.bedrooms,
        bathrooms: raw.property.bathrooms,
        surface: raw.property.surface,
        surfaceUnit: raw.property.surfaceUnit,
        location: raw.property.location,
        latitude: raw.property.latitude,
        longitude: raw.property.longitude,
        status: raw.property.status,
        aiTitle: raw.property.aiTitle,
        aiDescription: raw.property.aiDescription,
        aiStatus: raw.property.aiStatus,
        userId: raw.property.userId,
        images: (raw.property.images || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          filename: img.filename,
          mimetype: img.mimetype,
          size: img.size,
          isPrimary: img.isPrimary,
          propertyId: img.propertyId,
          createdAt: img.createdAt,
        })),
        createdAt: raw.property.createdAt,
        updatedAt: raw.property.updatedAt,
      },
    };
  }
}
