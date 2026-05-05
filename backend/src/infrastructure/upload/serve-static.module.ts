import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

@Module({})
export class ServeStaticModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(express.static(join(process.cwd(), UPLOAD_DIR)))
      .forRoutes('/uploads');
  }
}
