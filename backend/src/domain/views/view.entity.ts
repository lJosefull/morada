export interface IPropertyView {
  id: string;
  propertyId: string;
  userId: string | null;
  ip: string | null;
  createdAt: Date;
}

export interface IDailyPropertyStats {
  id: string;
  propertyId: string;
  date: Date;
  views: number;
  uniqueViews: number;
  inquiriesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePropertyViewInput = {
  propertyId: string;
  userId?: string;
  ip?: string;
};
