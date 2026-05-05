```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PropertyRepository } from '../../domain/properties/property.repository';
import { Property } from '../../domain/properties/property.entity';

@Injectable()
export class PrismaPropertyRepository implements PropertyRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ properties: Property[]; total: number }> {
    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          images: true,
        },
      }),
      this.prisma.property.count({ where: params.where }),
    ]);

    return { properties, total };
  }

  async findById(id: string): Promise<Property | null> {
    return this.prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: true,
      },
    });
  }

  async create(data: any): Promise<Property> {
    return this.prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        type: data.type,
        status: 'AVAILABLE',
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        squareFootage: data.squareFootage,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        amenities: data.amenities || [],
        owner: {
          connect: { id: data.ownerId },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: true,
      },
    });
  }

  async update(id: string, data: any): Promise<Property> {
    return this.prisma.property.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.property.delete({ where: { id } });
  }
}
```