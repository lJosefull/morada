import { IUser, CreateUserInput } from './user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
  create(input: CreateUserInput): Promise<IUser>;
  update(id: string, input: Partial<IUser>): Promise<IUser>;
}
