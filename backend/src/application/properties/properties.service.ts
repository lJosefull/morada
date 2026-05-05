import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IPropertyRepository,
  PROPERTY_REPOSITORY,
  PropertyFilters,
} from '../../domain/properties/property.repository';
import { IProperty, CreatePropertyInput, UpdatePropertyInput } from '../../domain/properties/property.entity';
import { IAiService, AI_SERVICE } from '../../domain/ai/ai.types';

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
    @Inject(AI_SERVICE)
    private readonly aiService: IAiService,
  ) {}

  async findById(id: string): Promise<IProperty> {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  async findMany(
    filters: PropertyFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: IProperty[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.propertyRepository.findMany(filters, skip, limit);
    return { data, total, page, limit };
  }

  async create(input: CreatePropertyInput, userId: string): Promise<IProperty> {
    const property = await this.propertyRepository.create({ ...input, userId });

    this.enrichWithAi(property.id, input).catch((err) => {
      console.error('AI enrichment failed:', err);
    });

    return property;
  }

  async update(id: string, input: UpdatePropertyInput, userId: string): Promise<IProperty> {
    const property = await this.findById(id);
    if (property.userId !== userId) {
      throw new NotFoundException('Property not found');
    }
    return this.propertyRepository.update(id, input);
  }

  async delete(id: string, userId: string): Promise<void> {
    const property = await this.findById(id);
    if (property.userId !== userId) {
      throw new NotFoundException('Property not found');
    }
    await this.propertyRepository.delete(id);
  }

  private async enrichWithAi(propertyId: string, input: CreatePropertyInput): Promise<void> {
    try {
      await this.propertyRepository.update(propertyId, { aiStatus: 'processing' as any });

      const result = await this.aiService.enhanceProperty({
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
      });

      await this.propertyRepository.update(propertyId, {
        aiTitle: result.optimizedTitle,
        aiDescription: result.improvedDescription,
        aiStatus: 'completed',
      });
    } catch (error) {
      await this.propertyRepository.update(propertyId, {
        aiStatus: 'failed' as any,
      });
      throw error;
    }
  }
}
