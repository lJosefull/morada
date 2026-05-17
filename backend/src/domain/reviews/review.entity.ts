export interface IReview {
  id: string;
  propertyId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  reply: string | null;       // Owner's reply to this review
  replyDate: Date | null;    // When the owner replied
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
  };
}

export type CreateReviewInput = {
  propertyId: string;
  userId: string;
  rating: number;
  comment: string;
};

export type UpdateReviewInput = {
  rating?: number;
  comment?: string;
};

export type ReviewStats = {
  average: number;
  total: number;
  distribution: Record<number, number>; // { 1: X, 2: Y, 3: Z, 4: W, 5: V }
};
