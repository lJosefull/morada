export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserInput = {
  email: string;
  name: string;
  phone?: string;
};

export type UpdateUserInput = Partial<Pick<IUser, 'name' | 'phone'>>;
