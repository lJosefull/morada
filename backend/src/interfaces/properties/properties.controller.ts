import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PropertiesService } from '../../application/properties/properties.service';
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from './properties.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Public } from '../../infrastructure/auth/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all properties with filters' })
  async findAll(@Query() query: PropertyQueryDto) {
    return this.propertiesService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my properties' })
  async findMine(@Req() req: any) {
    return this.propertiesService.findAll({ userId: req.user.id } as PropertyQueryDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property' })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Req() req: any,
  ) {
    return this.propertiesService.create(createPropertyDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a property' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: any,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a property' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.propertiesService.remove(id, req.user.id);
  }
}
