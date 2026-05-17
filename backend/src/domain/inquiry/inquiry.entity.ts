export type InquiryStatus = 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted';

export interface IInquiry {
  id: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: InquiryStatus;
  notes: string | null;
  ownerUserId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  statusChanges?: IInquiryStatusChange[];
}

export interface IInquiryStatusChange {
  id: string;
  inquiryId: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: Date;
}

export type CreateInquiryInput = {
  propertyId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  ownerUserId: string;
  userId?: string;
};

export type UpdateInquiryStatusInput = {
  status: InquiryStatus;
};

export type UpdateInquiryNotesInput = {
  notes: string;
};
