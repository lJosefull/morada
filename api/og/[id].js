const SITE_URL = 'https://morada.viewsoft.com.co';
const API_BASE = process.env.VITE_API_URL || 'https://morada-api.viewsoft.com.co';

module.exports = async function handler(req, res) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).send('Missing property id');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/properties/${id}`);
    if (!response.ok) throw new Error('Property not found');
    const property = await response.json();

    const title = property.aiTitle || property.title || 'Propiedad';
    const description = property.description
      ? property.description.slice(0, 300)
      : 'Descubre esta propiedad en Morada — Marketplace Inmobiliario Inteligente';
    const rawImage = property.images?.[0]?.url;
    const image = rawImage
      ? (rawImage.startsWith('http') ? rawImage : `${API_BASE}${rawImage}`)
      : `${SITE_URL}/favicon-256.png`;
    const price = property.price
      ? `$${Number(property.price).toLocaleString('es-CO')}`
      : '';
    const typeLabels = {
      house: 'Casa',
      apartment: 'Apartamento',
      land: 'Terreno',
      commercial: 'Local Comercial',
      office: 'Oficina',
      warehouse: 'Bodega',
    };
    const typeLabel = typeLabels[property.propertyType] || property.propertyType || '';
    const listingLabel = property.listingType === 'rent' ? 'En Arriendo' : 'En Venta';
    const ogTitle = `${title}${price ? ` - ${price}` : ''}`;
    const url = `${SITE_URL}/properties/${id}`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} | Morada</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:title" content="${esc(ogTitle)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Morada" />
  <meta property="og:locale" content="es_CO" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(ogTitle)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <meta http-equiv="refresh" content="0;url=${esc(url)}" />
  <script>window.location.replace('${esc(url)}')</script>
</head>
<body>
  <p>Redirigiendo a <a href="${esc(url)}">${esc(title)}</a> en Morada...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(html);
  } catch {
    res.redirect(302, `${SITE_URL}/properties/${id}`);
  }
};

function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
