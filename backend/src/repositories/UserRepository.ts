```typescript
import { prisma } from '../lib/prisma';

export class UserRepository {
  static async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async create(data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }) {
    return prisma.user.create({ data });
  }

  static async saveRefreshToken(userId: string, refreshToken: string) {
    return prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });
  }

  static async findRefreshToken(userId: string, token: string) {
    return prisma.refreshToken.findFirst({
      where: {
        userId,
        token,
        expiresAt: { gt: new Date() }
      }
    });
  }

  static async removeRefreshToken(userId: string, token: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId, token }
    });
  }
}
```