import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IPropertyRepository, PropertyFilters } from '../../domain/properties/property.repository';
import { IProperty, CreatePropertyInput, UpdatePropertyInput } from '../../domain/properties/property.entity';

@Injectable()
export class PrismaPropertyRepository implements IPropertyRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<IProperty | null> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!property) return null;
    return this.toDomain(property);
  }

  async findMany(
    filters: PropertyFilters,
    skip = 0,
    take = 20,
  ): Promise<[IProperty[], number]> {
    const where = this.buildWhereClause(filters);
    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { images: true },
      }),
      this.prisma.property.count({ where }),
    ]);
    return [properties.map((p) => this.toDomain(p)), total];
  }

  async create(input: CreatePropertyInput & { userId: string }): Promise<IProperty> {
    const property = await this.prisma.property.create({
      data: {
        title: input.title,
        description: input.description,
        price: input.price,
        currency: input.currency || 'CLP',
        propertyType: input.propertyType,
        listingType: input.listingType,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        surface: input.surface ?? null,
        location: input.location,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        user: { connect: { id: input.userId } },
      },
      include: { images: true },
    });
    return this.toDomain(property);
  }

  async update(id: string, input: UpdatePropertyInput): Promise<IProperty> {
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.price !== undefined) data.price = input.price;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.propertyType !== undefined) data.propertyType = input.propertyType;
    if (input.listingType !== undefined) data.listingType = input.listingType;
    if (input.bedrooms !== undefined) data.bedrooms = input.bedrooms;
    if (input.bathrooms !== undefined) data.bathrooms = input.bathrooms;
    if (input.surface !== undefined) data.surface = input.surface;
    if (input.location !== undefined) data.location = input.location;
    if (input.latitude !== undefined) data.latitude = input.latitude;
    if (input.longitude !== undefined) data.longitude = input.longitude;
    if (input.status !== undefined) data.status = input.status;
    if (input.aiTitle !== undefined) data.aiTitle = input.aiTitle;
    if (input.aiDescription !== undefined) data.aiDescription = input.aiDescription;
    if (input.aiStatus !== undefined) data.aiStatus = input.aiStatus;

    const property = await this.prisma.property.update({
      where: { id },
      data,
      include: { images: true },
    });
    return this.toDomain(property);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.property.delete({ where: { id } });
  }

  private buildWhereClause(filters: PropertyFilters): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (filters.propertyType) where.propertyType = filters.propertyType;
    if (filters.listingType) where.listingType = filters.listingType;
    if (filters.bedrooms !== undefined) where.bedrooms = { gte: filters.bedrooms };
    if (filters.bathrooms !== undefined) where.bathrooms = { gte: filters.bathrooms };
    if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.status) {
      where.status = filters.status;
    } else if (!filters.userId) {
      where.status = { not: 'hidden' };
    }
    if (filters.userId) where.userId = filters.userId;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) (where.price as Record<string, unknown>).gte = filters.minPrice;
      if (filters.maxPrice !== undefined) (where.price as Record<string, unknown>).lte = filters.maxPrice;
    }
    return where;
  }

  private toDomain(raw: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    propertyType: string;
    listingType: string;
    bedrooms: number | null;
    bathrooms: number | null;
    surface: number | null;
    surfaceUnit: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    status: string;
    aiTitle: string | null;
    aiDescription: string | null;
    aiStatus: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    images?: Array<{
      id: string;
      url: string;
      filename: string;
      mimetype: string;
      size: number;
      isPrimary: boolean;
      propertyId: string;
      createdAt: Date;
    }>;
  }): IProperty {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      price: raw.price,
      currency: raw.currency,
      propertyType: raw.propertyType as IProperty['propertyType'],
      listingType: raw.listingType as IProperty['listingType'],
      bedrooms: raw.bedrooms,
      bathrooms: raw.bathrooms,
      surface: raw.surface,
      surfaceUnit: raw.surfaceUnit,
      location: raw.location,
      latitude: raw.latitude,
      longitude: raw.longitude,
      status: raw.status as IProperty['status'],
      aiTitle: raw.aiTitle,
      aiDescription: raw.aiDescription,
      aiStatus: raw.aiStatus as IProperty['aiStatus'],
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      images: (raw.images || []).map((img) => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        mimetype: img.mimetype,
        size: img.size,
        isPrimary: img.isPrimary,
        propertyId: img.propertyId,
        createdAt: img.createdAt,
      })),
    };
  }
}
