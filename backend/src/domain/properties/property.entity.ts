export interface IProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: PropertyType;
  listingType: ListingType;
  bedrooms: number | null;
  bathrooms: number | null;
  surface: number | null;
  surfaceUnit: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  aiTitle: string | null;
  aiDescription: string | null;
  aiStatus: AiStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PropertyType = 'house' | 'apartment' | 'land' | 'commercial';
export type ListingType = 'sale' | 'rent';
export type AiStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type CreatePropertyInput = {
  title: string;
  description: string;
  price: number;
  currency?: string;
  propertyType: PropertyType;
  listingType: ListingType;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  location: string;
  latitude?: number;
  longitude?: number;
};

export type UpdatePropertyInput = Partial<Omit<CreatePropertyInput, 'userId'>> & {
  aiTitle?: string;
  aiDescription?: string;
  aiStatus?: AiStatus;
  isActive?: boolean;
};
