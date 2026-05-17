import { IProperty } from '../properties/property.entity';

export interface IFavorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: Date;
}

export type FavoriteWithProperty = IFavorite & {
  property: IProperty;
};
