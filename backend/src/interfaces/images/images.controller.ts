import {
  Controller,
  Post,
  Delete,
  Param,
  Req,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ImagesService } from '../../application/images/images.service';
import { UploadFile } from '../../infrastructure/upload/file-upload.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('images')
@Controller('properties/:propertyId/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UploadFile('image')
  @ApiBearerAuth()
  async upload(
    @Param('propertyId') propertyId: string,
    @Req() req: Request,
    @Body('isPrimary') isPrimary?: string,
  ) {
    const file = (req as any).file;
    const userId = (req as any).user.id;
    return this.imagesService.upload(propertyId, file, userId, isPrimary === 'true');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    await this.imagesService.delete(id, userId);
  }

  @Post(':id/primary')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async setPrimary(
    @Param('id') id: string,
    @Param('propertyId') propertyId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    await this.imagesService.setPrimary(id, propertyId, userId);
    return { message: 'Primary image updated' };
  }
}
