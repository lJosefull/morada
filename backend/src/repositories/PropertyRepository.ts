```typescript
import { prisma } from '../lib/prisma';

export class PropertyRepository {
  static async findById(id: string) {
    return prisma.property.findUnique({ where: { id } });
  }

  static async findByUserId(userId: string, take: number, skip: number) {
    return prisma.property.findMany({
      where: { userId },
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: { images: true }
    });
  }

  static async countByUserId(userId: string) {
    return prisma.property.count({ where: { userId } });
  }

  static async create(data: {
    title: string;
    description: string;
    price: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    userId: string;
    images?: { url: string }[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    return prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        userId: data.userId,
        images: data.images ? {
          create: data.images
        } : undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      },
      include: { images: true }
    });
  }

  static async update(id: string, data: {
    title?: string;
    description?: string;
    price?: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    images?: { url: string }[];
    updatedAt: Date;
  }) {
    return prisma.property.update({
      where: { id },
      data: {
        ...data,
        images: data.images ? {
          deleteMany: {},
          create: data.images
        } : undefined
      },
      include: { images: true }
    });
  }

  static async delete(id: string) {
    await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
    return prisma.property.delete({ where: { id } });
  }
}
```