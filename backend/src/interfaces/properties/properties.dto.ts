```typescript
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PropertyType {
  HOUSE = 'HOUSE',
  APARTMENT = 'APARTMENT',
  CONDO = 'CONDO',
  LAND = 'LAND',
  COMMERCIAL = 'COMMERCIAL',
}

export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
}

export class CreatePropertyDto {
  @ApiProperty({ example: 'Beautiful House in the Suburbs' })
  @IsString()
  @Min(2)
  @Max(200)
  title: string;

  @ApiProperty({ example: 'A beautiful house with 3 bedrooms and 2 bathrooms...' })
  @IsString()
  @Min(10)
  @Max(2000)
  description: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ enum: PropertyType, example: PropertyType.HOUSE })
  @IsEnum(PropertyType)
  type: PropertyType;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @Min(5)
  @Max(200)
  address: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @Min(2)
  @Max(100)
  city: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  @Min(2)
  @Max(50)
  state: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @Min(5)
  @Max(20)
  zipCode: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  squareFootage: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  bedrooms: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  bathrooms: number;

  @ApiPropertyOptional({ example: ['Pool', 'Garage', 'Garden'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}

export class UpdatePropertyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Min(2)
  @Max(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Min(10)
  @Max(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Min(5)
  @Max(200)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Min(2)
  @Max(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Min(2)
  @Max(50)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Min(5)
  @Max(20)
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  squareFootage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  bathrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ enum: PropertyStatus })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}

export class PropertyQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PropertyStatus })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minBedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minBathrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
```