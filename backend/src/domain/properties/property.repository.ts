import { IProperty, CreatePropertyInput, UpdatePropertyInput } from './property.entity';

export const PROPERTY_REPOSITORY = 'PROPERTY_REPOSITORY';

export type PropertyFilters = {
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  status?: string;
  userId?: string;
};

export interface IPropertyRepository {
  findById(id: string): Promise<IProperty | null>;
  findMany(filters: PropertyFilters, skip?: number, take?: number): Promise<[IProperty[], number]>;
  create(input: CreatePropertyInput & { userId: string }): Promise<IProperty>;
  update(id: string, input: UpdatePropertyInput): Promise<IProperty>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}
