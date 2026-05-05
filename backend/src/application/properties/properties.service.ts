```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PropertyRepository } from '../../domain/properties/property.repository';
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from '../../interfaces/properties/properties.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async findAll(query: PropertyQueryDto) {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;
    
    return this.propertyRepository.findAll({
      skip,
      take: limit,
      where: this.buildWhereClause(filters),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  async create(createPropertyDto: CreatePropertyDto, userId: string, files?: Express.Multer.File[]) {
    const property = await this.propertyRepository.create({
      ...createPropertyDto,
      ownerId: userId,
    });

    // If files are provided, upload them
    if (files && files.length > 0) {
      // Handle file uploads here
      // This would typically involve uploading to a cloud storage service
    }

    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own properties');
    }

    return this.propertyRepository.update(id, updatePropertyDto);
  }

  async remove(id: string, userId: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own properties');
    }

    return this.propertyRepository.delete(id);
  }

  private buildWhereClause(filters: Partial<PropertyQueryDto>) {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    if (filters.minBedrooms) {
      where.bedrooms = { gte: filters.minBedrooms };
    }

    if (filters.minBathrooms) {
      where.bathrooms = { gte: filters.minBathrooms };
    }

    return where;
  }
}
```