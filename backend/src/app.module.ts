import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { InquiryController } from './interfaces/inquiry/inquiry.controller';
import { InquiryService } from './application/inquiry/inquiry.service';
import { ViewsController } from './interfaces/views/views.controller';
import { ViewService } from './application/views/view.service';
import { FavoritesController } from './interfaces/favorites/favorites.controller';
import { FavoritesService } from './application/favorites/favorites.service';
import { ReviewsController } from './interfaces/reviews/reviews.controller';
import { ReviewsService } from './application/reviews/reviews.service';
import { ServeStaticModule } from './infrastructure/upload/serve-static.module';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthInfrastructureModule,
    ServeStaticModule,
  ],
  controllers: [
    AuthController,
    PropertiesController,
    ImagesController,
    UsersController,
    InquiryController,
    ViewsController,
    FavoritesController,
    ReviewsController,
  ],
  providers: [
    AuthService,
    PropertiesService,
    ImagesService,
    UsersService,
    InquiryService,
    ViewService,
    FavoritesService,
    ReviewsService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
