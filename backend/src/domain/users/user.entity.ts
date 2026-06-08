export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  googleId: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserInput = {
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  googleId?: string | null;
  passwordHash?: string;
};

export type UpdateUserInput = Partial<Pick<IUser, 'name' | 'phone' | 'email'>>;
