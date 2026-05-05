import { Injectable } from '@nestjs/common';
import { IPropertyRepository, PropertyFilters } from '../../domain/properties/property.repository';
import { IProperty, CreatePropertyInput, UpdatePropertyInput } from '../../domain/properties/property.entity';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaPropertyRepository implements IPropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    skip: number = 0,
    take: number = 20,
  ): Promise<[IProperty[], number]> {
    const where: Prisma.PropertyWhereInput = {};

    if (filters.propertyType) where.propertyType = filters.propertyType;
    if (filters.listingType) where.listingType = filters.listingType;
    if (filters.bedrooms) where.bedrooms = { gte: filters.bedrooms };
    if (filters.bathrooms) where.bathrooms = { gte: filters.bathrooms };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.userId) where.userId = filters.userId;
    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        skip,
        take,
        include: { images: true, user: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where }),
    ]);

    return [data.map((p) => this.toDomain(p)), total];
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
        latitude: (input as any).latitude ?? null,
        longitude: (input as any).longitude ?? null,
        userId: input.userId,
      },
      include: { images: true },
    });
    return this.toDomain(property);
  }

  async update(id: string, input: UpdatePropertyInput): Promise<IProperty> {
    const property = await this.prisma.property.update({
      where: { id },
      data: input as any,
      include: { images: true },
    });
    return this.toDomain(property);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.image.deleteMany({ where: { propertyId: id } });
    await this.prisma.property.delete({ where: { id } });
  }

  private toDomain(raw: any): IProperty {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      price: raw.price,
      currency: raw.currency,
      propertyType: raw.propertyType,
      listingType: raw.listingType,
      bedrooms: raw.bedrooms,
      bathrooms: raw.bathrooms,
      surface: raw.surface,
      surfaceUnit: raw.surfaceUnit,
      location: raw.location,
      latitude: raw.latitude,
      longitude: raw.longitude,
      isActive: raw.isActive,
      aiTitle: raw.aiTitle,
      aiDescription: raw.aiDescription,
      aiStatus: raw.aiStatus,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
