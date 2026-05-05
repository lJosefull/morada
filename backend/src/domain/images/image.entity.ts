export interface IImage {
  id: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  isPrimary: boolean;
  propertyId: string;
  createdAt: Date;
}

export type CreateImageInput = {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  isPrimary?: boolean;
  propertyId: string;
};
