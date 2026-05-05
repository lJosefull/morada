import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PropertiesService } from '../../application/properties/properties.service';
import { CreatePropertyDto, UpdatePropertyDto, QueryPropertiesDto } from './properties.dto';
import { Public } from '../../infrastructure/auth/public.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Public()
  @Get()
  async findAll(@Query() query: QueryPropertiesDto) {
    return this.propertiesService.findMany(
      {
        propertyType: query.propertyType,
        listingType: query.listingType,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        bedrooms: query.bedrooms,
        location: query.location,
      },
      query.page || 1,
      Math.min(query.limit || 20, 100),
    );
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreatePropertyDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.propertiesService.create(dto as any, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.propertiesService.update(id, dto as any, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    await this.propertiesService.delete(id, userId);
  }
}
