```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { UserRepository } from '../../domain/users/user.repository';
import { PrismaUserRepository } from '../database/prisma-user.repository';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'access-secret',
      signOptions: { expiresIn: '15m' },
    }),
    PrismaModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
```