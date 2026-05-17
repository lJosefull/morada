import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IFavoriteRepository, FAVORITE_REPOSITORY } from '../../domain/favorites/favorite.repository';
import { IPropertyRepository, PROPERTY_REPOSITORY } from '../../domain/properties/property.repository';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject(FAVORITE_REPOSITORY)
    private readonly favoriteRepository: IFavoriteRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async toggle(userId: string, propertyId: string) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const existing = await this.favoriteRepository.findByUserAndProperty(userId, propertyId);
    if (existing) {
      await this.favoriteRepository.delete(existing.id);
      return { favorited: false };
    }

    await this.favoriteRepository.create(userId, propertyId);
    return { favorited: true };
  }

  async findAll(userId: string) {
    const [data, total] = await this.favoriteRepository.findByUserId(userId);
    return { data, total };
  }

  async check(userId: string, propertyIds: string[]) {
    const favorites = await this.favoriteRepository.findByUserAndPropertyIds(userId, propertyIds);
    const result: Record<string, boolean> = {};
    for (const id of propertyIds) {
      result[id] = favorites.some((f) => f.propertyId === id);
    }
    return result;
  }
}
