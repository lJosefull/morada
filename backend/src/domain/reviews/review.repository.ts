import { IReview, CreateReviewInput, UpdateReviewInput, ReviewStats } from './review.entity';

export const REVIEW_REPOSITORY = 'REVIEW_REPOSITORY';

export interface IReviewRepository {
  findById(id: string): Promise<IReview | null>;

  findByProperty(
    propertyId: string,
    skip?: number,
    take?: number,
  ): Promise<[IReview[], number]>;

  findByUserAndProperty(
    userId: string,
    propertyId: string,
  ): Promise<IReview | null>;

  create(input: CreateReviewInput): Promise<IReview>;

  update(id: string, input: UpdateReviewInput): Promise<IReview>;

  setReply(id: string, reply: string): Promise<IReview>;

  removeReply(id: string): Promise<IReview>;

  delete(id: string): Promise<void>;

  getStats(propertyId: string): Promise<ReviewStats>;

  hasUserInquired(userId: string, propertyId: string): Promise<boolean>;
}
