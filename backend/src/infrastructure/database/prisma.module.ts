import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaPropertyRepository } from './prisma-property.repository';
import { PrismaImageRepository } from './prisma-image.repository';
import { PrismaInquiryRepository } from './prisma-inquiry.repository';
import { PrismaViewRepository, PrismaDailyStatsRepository } from './prisma-view.repository';
import { PrismaFavoriteRepository } from './prisma-favorite.repository';
import { USER_REPOSITORY } from '../../domain/users/user.repository';
import { PROPERTY_REPOSITORY } from '../../domain/properties/property.repository';
import { IMAGE_REPOSITORY } from '../../domain/images/image.repository';
import { INQUIRY_REPOSITORY } from '../../domain/inquiry/inquiry.repository';
import { VIEW_REPOSITORY, DAILY_STATS_REPOSITORY } from '../../domain/views/view.repository';
import { FAVORITE_REPOSITORY } from '../../domain/favorites/favorite.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PROPERTY_REPOSITORY, useClass: PrismaPropertyRepository },
    { provide: IMAGE_REPOSITORY, useClass: PrismaImageRepository },
    { provide: INQUIRY_REPOSITORY, useClass: PrismaInquiryRepository },
    { provide: VIEW_REPOSITORY, useClass: PrismaViewRepository },
    { provide: DAILY_STATS_REPOSITORY, useClass: PrismaDailyStatsRepository },
    { provide: FAVORITE_REPOSITORY, useClass: PrismaFavoriteRepository },
  ],
  exports: [
    PrismaService,
    USER_REPOSITORY,
    PROPERTY_REPOSITORY,
    IMAGE_REPOSITORY,
    INQUIRY_REPOSITORY,
    VIEW_REPOSITORY,
    DAILY_STATS_REPOSITORY,
    FAVORITE_REPOSITORY,
  ],
})
export class PrismaModule {}
