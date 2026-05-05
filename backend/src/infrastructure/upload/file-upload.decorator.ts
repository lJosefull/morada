import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from './multer.config';

export function UploadFile(fieldName: string = 'file') {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, multerConfig)),
  );
}
