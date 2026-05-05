import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/users/user.repository';
import { IUser } from '../../domain/users/user.entity';
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

  async create(input: any): Promise<IUser> {
    const user = await this.prisma.user.create({ data: input });
    return this.toDomain(user);
  }

  async update(id: string, input: Partial<IUser>): Promise<IUser> {
    const data: any = {};
    if (input.name) data.name = input.name;
    if (input.phone) data.phone = input.phone;
    if (input.refreshToken !== undefined) data.refreshToken = input.refreshToken;

    const user = await this.prisma.user.update({ where: { id }, data });
    return this.toDomain(user);
  }

  private toDomain(raw: any): IUser {
    return {
      id: raw.id,
      email: raw.email,
      passwordHash: raw.passwordHash,
      name: raw.name,
      phone: raw.phone,
      role: raw.role,
      refreshToken: raw.refreshToken,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
