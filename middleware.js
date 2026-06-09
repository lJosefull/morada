// Vercel Edge Middleware — runs before any caching/routing
// Intercepts /og/:id to serve HTML with OG meta tags for social media crawlers

export const config = {
  matcher: '/og/:id',
};

const SITE_URL = 'https://morada.viewsoft.com.co';
const API_BASE = 'https://morada-api.viewsoft.com.co';

export default async function middleware(request) {
  const url = new URL(request.url);
  const id = url.pathname.replace('/og/', '');

  if (!id) {
    return new Response('Missing property id', { status: 400 });
  }

  try {
    const apiRes = await fetch(`${API_BASE}/api/properties/${id}`);
    if (!apiRes.ok) throw new Error('Not found');
    const property = await apiRes.json();

    const title = property.aiTitle || property.title || 'Propiedad';
    const description = property.description
      ? property.description.slice(0, 300)
      : 'Descubre esta propiedad en Morada';
    const rawImage = property.images?.[0]?.url;
    const image = rawImage
      ? (rawImage.startsWith('http') ? rawImage : `${API_BASE}${rawImage}`)
      : `${SITE_URL}/favicon-256.png`;
    const price = property.price
      ? `$${Number(property.price).toLocaleString('es-CO')}`
      : '';
    const loc = property.location || '';
    const typeLabels = { house: 'Casa', apartment: 'Apartamento', land: 'Terreno', commercial: 'Local Comercial', office: 'Oficina', warehouse: 'Bodega' };
    const typeLabel = typeLabels[property.propertyType] || property.propertyType || '';
    const listingLabel = property.listingType === 'rent' ? 'En Arriendo' : 'En Venta';
    const ogTitle = `${title}${price ? ` - ${price}` : ''}`;
    const targetUrl = `${SITE_URL}/properties/${id}`;
    const metaDesc = [listingLabel, typeLabel, loc, price].filter(Boolean).join(' | ') || description;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)} | Morada</title>
  <meta name="description" content="${esc(metaDesc)}" />
  <meta property="og:title" content="${esc(ogTitle)}" />
  <meta property="og:description" content="${esc(metaDesc)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(targetUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Morada" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(ogTitle)}" />
  <meta name="twitter:description" content="${esc(metaDesc)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <script>location.replace('${esc(targetUrl)}')</script>
</head>
<body><p>Redirigiendo...</p></body>
</html>`;

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch {
    const fallbackHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Morada — Marketplace Inmobiliario</title>
  <meta property="og:title" content="Propiedad en Morada" />
  <meta property="og:description" content="Descubre esta propiedad en Morada" />
  <meta property="og:url" content="${SITE_URL}/properties/${esc(id)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Morada" />
  <script>location.replace('${SITE_URL}/properties/${esc(id)}')</script>
</head>
<body><p>Redirigiendo...</p></body>
</html>`;

    return new Response(fallbackHtml, {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
