import { IImage, CreateImageInput } from './image.entity';

export const IMAGE_REPOSITORY = 'IMAGE_REPOSITORY';

export interface IImageRepository {
  findByPropertyId(propertyId: string): Promise<IImage[]>;
  create(input: CreateImageInput): Promise<IImage>;
  delete(id: string): Promise<void>;
  setPrimary(id: string, propertyId: string): Promise<void>;
}
