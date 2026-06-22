import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IImageRepository, IMAGE_REPOSITORY } from '../../domain/images/image.repository';
import { IPropertyRepository, PROPERTY_REPOSITORY } from '../../domain/properties/property.repository';
import { IImage } from '../../domain/images/image.entity';

@Injectable()
export class ImagesService {
  constructor(
    @Inject(IMAGE_REPOSITORY)
    private readonly imageRepository: IImageRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async findByPropertyId(propertyId: string): Promise<IImage[]> {
    return this.imageRepository.findByPropertyId(propertyId);
  }

  async upload(
    propertyId: string,
    file: Express.Multer.File,
    userId: string,
    isPrimary?: boolean,
  ): Promise<IImage> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    if (property.userId !== userId) throw new ForbiddenException('You can only upload images to your own properties');

    const url = `/uploads/${file.filename}`;
    return this.imageRepository.create({
      url,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      isPrimary: isPrimary || false,
      propertyId,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const image = await this.imageRepository.findById(id);
    if (!image) throw new NotFoundException('Image not found');
    const property = await this.propertyRepository.findById(image.propertyId);
    if (!property || property.userId !== userId) throw new ForbiddenException('You can only delete images from your own properties');
    await this.imageRepository.delete(id);
  }

  async setPrimary(id: string, propertyId: string, userId: string): Promise<void> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    if (property.userId !== userId) throw new ForbiddenException('You can only set primary images on your own properties');
    await this.imageRepository.setPrimary(id, propertyId);
  }
}
