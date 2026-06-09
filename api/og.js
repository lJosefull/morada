const SITE_URL = 'https://morada.viewsoft.com.co';
const API_BASE = process.env.VITE_API_URL || 'https://morada-api.viewsoft.com.co';

module.exports = async function handler(req, res) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).send('Missing property id');
  }

  try {
    const response = await fetch(`${API_BASE}/api/properties/${id}`);
    if (!response.ok) throw new Error('Property not found');
    const property = await response.json();

    const title = property.aiTitle || property.title || 'Propiedad';
    const desc = property.description
      ? property.description.slice(0, 300)
      : 'Descubre esta propiedad en Morada';
    const rawImage = property.images?.[0]?.url;
    const image = rawImage
      ? (rawImage.startsWith('http') ? rawImage : `${API_BASE}${rawImage}`)
      : `${SITE_URL}/favicon-256.png`;
    const price = property.price ? `$${Number(property.price).toLocaleString('es-CO')}` : '';
    const loc = property.location || '';
    const typeLabels = { house: 'Casa', apartment: 'Apartamento', land: 'Terreno', commercial: 'Local Comercial', office: 'Oficina', warehouse: 'Bodega' };
    const typeLabel = typeLabels[property.propertyType] || property.propertyType || '';
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
  <meta property="og:url" content="${esc(ogUrl)}" />
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

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(html);
  } catch (err) {
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Morada — Marketplace Inmobiliario</title>
  <meta property="og:title" content="Propiedad en Morada" />
  <meta property="og:description" content="Descubre esta propiedad en Morada" />
  <meta property="og:image" content="${SITE_URL}/favicon-256.png" />
  <meta property="og:image:width" content="256" />
  <meta property="og:image:height" content="256" />
  <meta property="og:url" content="${SITE_URL}/og/${esc(id)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Morada" />
  <script>location.replace('${SITE_URL}/properties/${esc(id)}')</script>
</head>
<body><p>Redirigiendo...</p></body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(html);
  }
};

function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
