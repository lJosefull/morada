import { IPropertyView, IDailyPropertyStats, CreatePropertyViewInput } from './view.entity';

export const VIEW_REPOSITORY = 'VIEW_REPOSITORY';
export const DAILY_STATS_REPOSITORY = 'DAILY_STATS_REPOSITORY';

export interface IViewRepository {
  create(input: CreatePropertyViewInput): Promise<IPropertyView>;
  countByPropertyId(propertyId: string): Promise<number>;
  countByUserAndProperty(userId: string, propertyId: string): Promise<number>;
  countUniqueByPropertyId(propertyId: string): Promise<number>;
  countByPropertySince(propertyId: string, since: Date): Promise<number>;
  countInquiriesSince(propertyId: string, since: Date): Promise<number>;
}

export interface IDailyStatsRepository {
  upsertView(propertyId: string, date: Date, isUnique: boolean): Promise<void>;
  upsertInquiry(propertyId: string, date: Date): Promise<void>;
  findByPropertyId(propertyId: string, days?: number): Promise<IDailyPropertyStats[]>;
}
