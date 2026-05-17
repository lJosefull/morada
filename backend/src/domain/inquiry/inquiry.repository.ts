import { IInquiry, CreateInquiryInput, UpdateInquiryStatusInput, UpdateInquiryNotesInput } from './inquiry.entity';

export const INQUIRY_REPOSITORY = 'INQUIRY_REPOSITORY';

export interface IInquiryRepository {
  findById(id: string): Promise<IInquiry | null>;
  findByOwner(ownerUserId: string, status?: string, skip?: number, take?: number): Promise<[IInquiry[], number]>;
  findByUser(userId: string, skip?: number, take?: number): Promise<[IInquiry[], number]>;
  create(input: CreateInquiryInput): Promise<IInquiry>;
  updateStatus(id: string, input: UpdateInquiryStatusInput): Promise<IInquiry>;
  updateNotes(id: string, input: UpdateInquiryNotesInput): Promise<IInquiry>;
  countByPropertyId(propertyId: string): Promise<number>;
  countByOwnerAndStatus(ownerUserId: string): Promise<{ status: string; count: number }[]>;
  addStatusChange(inquiryId: string, fromStatus: string | null, toStatus: string): Promise<void>;
}
