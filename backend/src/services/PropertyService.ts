```typescript
import { PropertyRepository } from '../repositories/PropertyRepository';

interface PropertyData {
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  images?: { url: string }[];
}

export class PropertyService {
  static async list(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      PropertyRepository.findByUserId(userId, limit, offset),
      PropertyRepository.countByUserId(userId)
    ]);

    return {
      properties,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getById(id: string) {
    return PropertyRepository.findById(id);
  }

  static async create(userId: string, propertyData: PropertyData) {
    return PropertyRepository.create({
      ...propertyData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static async update(id: string, userId: string, propertyData: Partial<PropertyData>) {
    const property = await PropertyRepository.findById(id);
    if (!property) {
      return null;
    }

    if (property.userId !== userId) {
      throw new Error('Not authorized to update this property');
    }

    return PropertyRepository.update(id, {
      ...propertyData,
      updatedAt: new Date()
    });
  }

  static async delete(id: string, userId: string) {
    const property = await PropertyRepository.findById(id);
    if (!property) {
      return false;
    }

    if (property.userId !== userId) {
      throw new Error('Not authorized to delete this property');
    }

    return PropertyRepository.delete(id);
  }
}
```