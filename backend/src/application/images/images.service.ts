import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IImageRepository, IMAGE_REPOSITORY } from '../../domain/images/image.repository';
import { IImage } from '../../domain/images/image.entity';

@Injectable()
export class ImagesService {
  constructor(
    @Inject(IMAGE_REPOSITORY)
    private readonly imageRepository: IImageRepository,
  ) {}

  async findByPropertyId(propertyId: string): Promise<IImage[]> {
    return this.imageRepository.findByPropertyId(propertyId);
  }

  async upload(
    propertyId: string,
    file: Express.Multer.File,
    isPrimary?: boolean,
  ): Promise<IImage> {
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

  async delete(id: string): Promise<void> {
    await this.imageRepository.delete(id);
  }

  async setPrimary(id: string, propertyId: string): Promise<void> {
    await this.imageRepository.setPrimary(id, propertyId);
  }
}
