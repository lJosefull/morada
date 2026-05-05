import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaPropertyRepository } from './prisma-property.repository';
import { PrismaImageRepository } from './prisma-image.repository';
import { USER_REPOSITORY } from '../../domain/users/user.repository';
import { PROPERTY_REPOSITORY } from '../../domain/properties/property.repository';
import { IMAGE_REPOSITORY } from '../../domain/images/image.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PROPERTY_REPOSITORY, useClass: PrismaPropertyRepository },
    { provide: IMAGE_REPOSITORY, useClass: PrismaImageRepository },
  ],
  exports: [
    PrismaService,
    USER_REPOSITORY,
    PROPERTY_REPOSITORY,
    IMAGE_REPOSITORY,
  ],
})
export class PrismaModule {}
