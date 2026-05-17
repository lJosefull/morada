import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthInfrastructureModule } from './infrastructure/auth/auth.module';
import { AuthController } from './interfaces/auth/auth.controller';
import { AuthService } from './application/auth/auth.service';
import { PropertiesController } from './interfaces/properties/properties.controller';
import { PropertiesService } from './application/properties/properties.service';
import { ImagesController } from './interfaces/images/images.controller';
import { ImagesService } from './application/images/images.service';
import { UsersController } from './interfaces/users/users.controller';
import { UsersService } from './application/users/users.service';
import { ServeStaticModule } from './infrastructure/upload/serve-static.module';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthInfrastructureModule,
    ServeStaticModule,
  ],
  controllers: [
    AuthController,
    PropertiesController,
    ImagesController,
    UsersController,
  ],
  providers: [
    AuthService,
    PropertiesService,
    ImagesService,
    UsersService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
