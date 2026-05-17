import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/users/user.repository';
import { IUser, CreateUserInput } from '../../domain/users/user.entity';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return this.toDomain(user);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return this.toDomain(user);
  }

  async create(input: CreateUserInput & { passwordHash: string }): Promise<IUser> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: input.passwordHash,
        name: input.name,
        phone: input.phone || null,
      },
    });
    return this.toDomain(user);
  }

  async update(id: string, input: Partial<IUser>): Promise<IUser> {
    const data: Record<string, unknown> = {};
    if (input.email) data.email = input.email;
    if (input.name) data.name = input.name;
    if (input.phone !== undefined) data.phone = input.phone;

    const user = await this.prisma.user.update({ where: { id }, data });
    return this.toDomain(user);
  }

  private toDomain(raw: {
    id: string;
    email: string;
    password: string;
    name: string;
    phone: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): IUser {
    return {
      id: raw.id,
      email: raw.email,
      passwordHash: raw.password,
      name: raw.name,
      phone: raw.phone,
      role: raw.role as 'user' | 'admin',
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
