import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  IPropertyRepository,
  PROPERTY_REPOSITORY,
  PropertyFilters,
} from '../../domain/properties/property.repository';
import { IUserRepository, USER_REPOSITORY } from '../../domain/users/user.repository';
import { PLAN_LIMITS } from '../../domain/users/user.entity';
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from '../../interfaces/properties/properties.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async findAll(query: PropertyQueryDto) {
    const { page = 1, limit = 20, search, ...rest } = query;
    const skip = (page - 1) * limit;
    const filters: PropertyFilters = {
      ...rest,
      location: rest.location || search,
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
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const limits = PLAN_LIMITS[user.plan]
    const count = await this.propertyRepository.countByUserId(userId)
    if (count >= limits.maxProperties) {
      const planLabel = user.plan === 'free' ? 'plan gratuito' : 'tu plan'
      throw new BadRequestException(`Has alcanzado el límite de ${limits.maxProperties} propiedades del ${planLabel}. Actualiza tu plan para publicar más.`)
    }

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
    if (!property.images?.length) {
      throw new BadRequestException('La propiedad debe tener al menos una imagen');
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
