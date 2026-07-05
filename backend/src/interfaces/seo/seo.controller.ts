import { Controller, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const SITE_URL = 'https://morada.viewsoft.com.co';
const API_URL = 'https://morada-api.viewsoft.com.co';

@ApiTags('seo')
@Controller()
export class SeoController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('api/seo/properties/:id')
  @ApiExcludeEndpoint()
  async seoPropertyPage(@Param('id') id: string, @Res() res: Response) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { images: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });

    if (!property) {
      // Return default SEO for not-found
      return res
        .type('html')
        .send(
          this.defaultHtml('Propiedad no encontrada', 'La propiedad que buscas no está disponible'),
        );
    }

    const title = `${property.title} | Morada`;
    const desc = (property.description || '').slice(0, 200);
    const price = property.price ? `$${Number(property.price).toLocaleString('es-CL')}` : '';
    const img = property.images?.[0]?.url
      ? property.images[0].url.startsWith('http')
        ? property.images[0].url
        : `${API_URL}${property.images[0].url}`
      : '';
    const pageUrl = `${SITE_URL}/properties/${id}`;

    res.type('html').send(this.propertyHtml(title, desc, img, pageUrl, price));
  }

  private propertyHtml(
    title: string,
    desc: string,
    img: string,
    url: string,
    price: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${this.e(title)}</title>
  <meta name="description" content="${this.e(desc)}">
  <meta property="og:title" content="${this.e(title)}">
  <meta property="og:description" content="${this.e(desc)}">
  ${img ? `<meta property="og:image" content="${this.e(img)}">` : ''}
  <meta property="og:url" content="${this.e(url)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Morada">
  ${price ? `<meta property="product:price:amount" content="${this.e(price.replace(/[^0-9]/g, ''))}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${this.e(title)}">
  <meta name="twitter:description" content="${this.e(desc)}">
  ${img ? `<meta name="twitter:image" content="${this.e(img)}">` : ''}
  <meta http-equiv="refresh" content="0; url=${this.e(url)}">
  <script>location.href=${JSON.stringify(url)}</script>
</head>
<body></body>
</html>`;
  }

  private defaultHtml(title: string, desc: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${this.e(title)} | Morada</title>
  <meta name="description" content="${this.e(desc)}">
  <meta property="og:title" content="${this.e(title)} | Morada">
  <meta property="og:description" content="${this.e(desc)}">
  <meta property="og:url" content="${this.e(SITE_URL)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Morada">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${this.e(title)} | Morada">
  <meta name="twitter:description" content="${this.e(desc)}">
</head>
<body></body>
</html>`;
  }

  private e(t: string): string {
    return t
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
