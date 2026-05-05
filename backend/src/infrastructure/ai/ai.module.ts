import { Module } from '@nestjs/common';
import { AI_SERVICE } from '../../domain/ai/ai.types';
import { AiClientService } from './ai-client.service';

@Module({
  providers: [
    {
      provide: AI_SERVICE,
      useClass: AiClientService,
    },
  ],
  exports: [AI_SERVICE],
})
export class AiInfrastructureModule {}
