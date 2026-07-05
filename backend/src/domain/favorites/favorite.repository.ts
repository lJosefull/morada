import { IFavorite, FavoriteWithProperty } from './favorite.entity';

export const FAVORITE_REPOSITORY = 'FAVORITE_REPOSITORY';

export interface IFavoriteRepository {
  findByUserId(
    userId: string,
    skip?: number,
    take?: number,
  ): Promise<[FavoriteWithProperty[], number]>;
  findByUserAndProperty(userId: string, propertyId: string): Promise<IFavorite | null>;
  findByUserAndPropertyIds(userId: string, propertyIds: string[]): Promise<IFavorite[]>;
  create(userId: string, propertyId: string): Promise<IFavorite>;
  delete(id: string): Promise<void>;
  countByPropertyId(propertyId: string): Promise<number>;
}
