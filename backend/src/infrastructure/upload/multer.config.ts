import { extname } from 'path';
import { openSync, readSync, closeSync, existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { HttpException, HttpStatus } from '@nestjs/common';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const ALLOWED_IMAGE_TYPES: Record<string, { ext: string }> = {
  'image/jpeg': { ext: '.jpg' },
  'image/png': { ext: '.png' },
  'image/webp': { ext: '.webp' },
  'image/gif': { ext: '.gif' },
};

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString('latin1');
    if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export function validateImageMagicBytes(filePath: string, mimetype: string): boolean {
  const fd = openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(12);
    const bytesRead = readSync(fd, buffer, 0, buffer.length, 0);
    const detected = detectImageMime(buffer.subarray(0, bytesRead));
    return detected !== null && detected === mimetype;
  } finally {
    closeSync(fd);
  }
}

export const multerConfig = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      if (!existsSync(UPLOAD_DIR)) {
        mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = ALLOWED_IMAGE_TYPES[file.mimetype]?.ext ?? '';
      cb(null, `${uuid()}${ext}`);
    },
  }),
  fileFilter: (_req: any, file: any, cb: any) => {
    const isAllowedMime = Boolean(ALLOWED_IMAGE_TYPES[file.mimetype]);
    const originalExt = extname(file.originalname || '').toLowerCase();
    const isAllowedExt = ALLOWED_EXTENSIONS.has(originalExt);
    if (!isAllowedMime || !isAllowedExt) {
      return cb(new HttpException('Invalid file type', HttpStatus.BAD_REQUEST), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  },
};
