import {
  Controller,
  Post,
  Delete,
  Param,
  Req,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ImagesService } from '../../application/images/images.service';
import { UploadFile } from '../../infrastructure/upload/file-upload.decorator';

@Controller('properties/:propertyId/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UploadFile('image')
  async upload(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Req() req: Request,
    @Body('isPrimary') isPrimary?: string,
  ) {
    const file = (req as any).file;
    return this.imagesService.upload(propertyId, file, isPrimary === 'true');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.imagesService.delete(id);
  }

  @Post(':id/primary')
  @HttpCode(HttpStatus.OK)
  async setPrimary(
    @Param('id') id: string,
    @Param('propertyId') propertyId: string,
  ) {
    await this.imagesService.setPrimary(id, propertyId);
    return { message: 'Primary image updated' };
  }
}
