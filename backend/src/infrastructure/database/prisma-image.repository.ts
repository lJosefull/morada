import { Injectable } from '@nestjs/common';
import { IImageRepository } from '../../domain/images/image.repository';
import { IImage, CreateImageInput } from '../../domain/images/image.entity';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaImageRepository implements IImageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPropertyId(propertyId: string): Promise<IImage[]> {
    const images = await this.prisma.image.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });
    return images.map(this.toDomain);
  }

  async create(input: CreateImageInput): Promise<IImage> {
    const image = await this.prisma.image.create({ data: input });
    return this.toDomain(image);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.image.delete({ where: { id } });
  }

  async setPrimary(id: string, propertyId: string): Promise<void> {
    await this.prisma.image.updateMany({
      where: { propertyId },
      data: { isPrimary: false },
    });
    await this.prisma.image.update({
      where: { id },
      data: { isPrimary: true },
    });
  }

  private toDomain(raw: any): IImage {
    return {
      id: raw.id,
      url: raw.url,
      filename: raw.filename,
      mimetype: raw.mimetype,
      size: raw.size,
      isPrimary: raw.isPrimary,
      propertyId: raw.propertyId,
      createdAt: raw.createdAt,
    };
  }
}
