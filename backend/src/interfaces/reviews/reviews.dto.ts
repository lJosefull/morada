import { IsString, IsInt, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 4 })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating!: number;

  @ApiProperty({ example: 'Excelente propiedad, muy recomendada.' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment!: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment?: string;
}

export class ReviewQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;
}

export class SetReviewReplyDto {
  @ApiProperty({ example: 'clx...' })
  @IsString()
  reviewId!: string;

  @ApiProperty({ example: 'Thank you for your review! We appreciate your feedback.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reply!: string;
}

export class RemoveReviewReplyDto {
  @ApiProperty({ example: 'clx...' })
  @IsString()
  reviewId!: string;
}
