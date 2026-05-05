import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthInfrastructureModule } from './infrastructure/auth/auth.module';
import { AiInfrastructureModule } from './infrastructure/ai/ai.module';
import { ServeStaticModule } from './infrastructure/upload/serve-static.module';
import { AuthModule } from './interfaces/auth/auth.module';
import { UserModule } from './interfaces/users/users.module';
import { PropertiesModule } from './interfaces/properties/properties.module';
import { ImagesModule } from './interfaces/images/images.module';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    AuthInfrastructureModule,
    AiInfrastructureModule,
    ServeStaticModule,
    AuthModule,
    UserModule,
    PropertiesModule,
    ImagesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
