import { Injectable } from '@nestjs/common';
import { AiPropertyInput, AiPropertyOutput } from '../../domain/ai/ai.types';

@Injectable()
export abstract class AiService {
  abstract enhanceProperty(input: AiPropertyInput): Promise<AiPropertyOutput>;
}
