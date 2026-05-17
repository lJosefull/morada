import { IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InquiryStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not_interested',
  CONVERTED = 'converted',
}

export class CreateInquiryDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Me interesa esta propiedad, ¿está disponible para visita?' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus, example: InquiryStatus.CONTACTED })
  @IsEnum(InquiryStatus)
  status!: InquiryStatus;
}

export class UpdateInquiryNotesDto {
  @ApiProperty({ example: 'Cliente contactado, agendó visita para el sábado' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  notes!: string;
}
