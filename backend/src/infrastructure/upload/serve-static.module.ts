import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

@Module({})
export class ServeStaticModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const staticPath = join(process.cwd(), UPLOAD_DIR);
    console.log('[ServeStaticModule] Serving static files from:', staticPath);
    consumer
      .apply(express.static(staticPath))
      .forRoutes({ path: '/uploads*', method: RequestMethod.GET });
  }
}
