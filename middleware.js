// Vercel Edge Middleware — runs at the edge BEFORE CDN cache
// Solves the 206 Partial Content issue that Facebook triggers with Range headers

export const config = {
  matcher: '/og/:id',
};

const SITE_URL = 'https://morada.viewsoft.com.co';
const API_BASE = 'https://morada-api.viewsoft.com.co';
const FB_APP_ID = '279587964583404'; // Reemplazar con tu FB App ID real

const TYPE_LABELS = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
  commercial: 'Local Comercial',
  office: 'Oficina',
  warehouse: 'Bodega',
};

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
    const desc = property.description ? property.description.slice(0, 300) : 'Descubre esta propiedad en Morada';
    const rawImage = property.images?.[0]?.url;
    const image = rawImage
      ? (rawImage.startsWith('http') ? rawImage : `${API_BASE}${rawImage}`)
      : `${SITE_URL}/favicon-256.png`;
    const price = property.price ? `$${Number(property.price).toLocaleString('es-CO')}` : '';
    const loc = property.location || '';
    const typeLabel = TYPE_LABELS[property.propertyType] || property.propertyType || '';
    const listingLabel = property.listingType === 'rent' ? 'En Arriendo' : 'En Venta';
    const ogTitle = `${title}${price ? ` - ${price}` : ''}`;
    const ogUrl = `${SITE_URL}/og/${id}`;
    const metaDesc = [listingLabel, typeLabel, loc, price].filter(Boolean).join(' | ') || desc;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)} | Morada</title>
  <meta name="description" content="${esc(metaDesc)}" />
  <meta property="og:title" content="${esc(ogTitle)}" />
  <meta property="og:description" content="${esc(metaDesc)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${esc(title)}" />
  <meta property="og:url" content="${esc(ogUrl)}" />
  <meta property="fb:app_id" content="${FB_APP_ID}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Morada" />
  <meta property="og:locale" content="es_CO" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(ogTitle)}" />
  <meta name="twitter:description" content="${esc(metaDesc)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <script>location.replace('${SITE_URL}/properties/${esc(id)}')</script>
</head>
<body><p>Redirigiendo...</p></body>
</html>`;

    return new Response(html, {
      status: 200,
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
  <meta property="og:image" content="${SITE_URL}/favicon-256.png" />
  <meta property="og:image:width" content="256" />
  <meta property="og:image:height" content="256" />
  <meta property="og:image:alt" content="Propiedad en Morada" />
  <meta property="og:url" content="${SITE_URL}/og/${esc(id)}" />
  <meta property="fb:app_id" content="${FB_APP_ID}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Morada" />
  <script>location.replace('${SITE_URL}/properties/${esc(id)}')</script>
</head>
<body><p>Redirigiendo...</p></body>
</html>`;

    return new Response(fallbackHtml, {
      status: 200,
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
