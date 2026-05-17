import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFavoriteDto {
  @ApiProperty({ example: 'clx...' })
  @IsString()
  propertyId!: string;
}

export class CheckFavoritesDto {
  @ApiProperty({ example: ['id1', 'id2', 'id3'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  propertyIds!: string[];
}
