export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'HOUSE' | 'APARTMENT' | 'CONDO' | 'LAND' | 'COMMERCIAL';
  status: 'AVAILABLE' | 'SOLD' | 'RENTED' | 'PENDING';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  ownerId: string;
  images?: PropertyImage[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  propertyId: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyDto {
  title: string;
  description: string;
  price: number;
  type: 'HOUSE' | 'APARTMENT' | 'CONDO' | 'LAND' | 'COMMERCIAL';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

export interface UpdatePropertyDto {
  title?: string;
  description?: string;
  price?: number;
  type?: 'HOUSE' | 'APARTMENT' | 'CONDO' | 'LAND' | 'COMMERCIAL';
  status?: 'AVAILABLE' | 'SOLD' | 'RENTED' | 'PENDING';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

export interface PropertyFilterDto {
  status?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
}