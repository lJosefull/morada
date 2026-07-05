export type Plan = 'free' | 'agent' | 'agency';

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  googleId: string | null;
  emailVerified: boolean;
  verificationToken: string | null;
  role: 'user' | 'admin';
  plan: Plan;
  agencyName: string | null;
  agencyLogo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const PLAN_LIMITS: Record<Plan, { maxProperties: number; maxImages: number }> = {
  free: { maxProperties: 3, maxImages: 5 },
  agent: { maxProperties: 50, maxImages: 20 },
  agency: { maxProperties: Infinity, maxImages: 50 },
};

export type CreateUserInput = {
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  googleId?: string | null;
  passwordHash?: string;
  verificationToken?: string | null;
  emailVerified?: boolean;
};

export type UpdateUserInput = Partial<Pick<IUser, 'name' | 'phone' | 'email'>>;
