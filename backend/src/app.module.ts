```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { AuthController } from './interfaces/auth/auth.controller';
import { AuthService } from './application/auth/auth.service';
import { PropertiesController } from './interfaces/properties/properties.controller';
import { PropertiesService } from './application/properties/properties.service';
import { ImagesController } from './interfaces/images/images.controller';
import { ImagesService } from './application/images/images.service';
import { UsersController } from './interfaces/users/users.controller';
import { UsersService } from './application/users/users.service';
import { AiModule } from './infrastructure/ai/ai.module';
import { ServeStaticModule } from './infrastructure/upload/serve-static.module';
import { UserRepository } from './domain/users/user.repository';
import { PropertyRepository } from './domain/properties/property.repository';
import { ImageRepository } from './domain/images/image.repository';
import { PrismaUserRepository } from './infrastructure/database/prisma-user.repository';
import { PrismaPropertyRepository } from './infrastructure/database/prisma-property.repository';
import { PrismaImageRepository } from './infrastructure/database/prisma-image.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    AiModule,
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
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: PropertyRepository,
      useClass: PrismaPropertyRepository,
    },
    {
      provide: ImageRepository,
      useClass: PrismaImageRepository,
    },
  ],
})
export class AppModule {}
```