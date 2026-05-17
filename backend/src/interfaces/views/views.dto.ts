import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RecordViewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip?: string;
}
