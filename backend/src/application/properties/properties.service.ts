import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  IPropertyRepository,
  PROPERTY_REPOSITORY,
  PropertyFilters,
} from '../../domain/properties/property.repository';
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from '../../interfaces/properties/properties.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async findAll(query: PropertyQueryDto) {
    const { page = 1, limit = 20, search, ...rest } = query;
    const skip = (page - 1) * limit;
    const filters: PropertyFilters = {
      ...rest,
      location: search,
    };
    const [data, total] = await this.propertyRepository.findMany(filters, skip, limit);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  async create(createPropertyDto: CreatePropertyDto, userId: string) {
    return this.propertyRepository.create({
      ...createPropertyDto,
      userId,
    });
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    if (property.userId !== userId) {
      throw new ForbiddenException('You can only update your own properties');
    }
    return this.propertyRepository.update(id, updatePropertyDto);
  }

  async remove(id: string, userId: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    if (property.userId !== userId) {
      throw new ForbiddenException('You can only delete your own properties');
    }
    return this.propertyRepository.delete(id);
  }
}
