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

    const title = property.aiTitle || property.title || 'Property';
    const description = property.description
      ? property.description.slice(0, 300)
      : 'Descubre esta propiedad en Morada — Marketplace Inmobiliario Inteligente';
    const rawImage = property.images?.[0]?.url;
    const image = rawImage
      ? (rawImage.startsWith('http') ? rawImage : `${API_BASE}${rawImage}`)
      : `${SITE_URL}/og-image-default.jpg`;
    const price = property.price
      ? `$${Number(property.price).toLocaleString('es-CO')}`
      : '';
    const location = property.location || '';
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

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | Morada</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}${price ? ` - ${price}` : ''}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${SITE_URL}/properties/${id}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Morada" />
  <meta property="og:locale" content="es_CO" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}${price ? ` - ${price}` : ''}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${SITE_URL}/properties/${id}" />
  <script>
    window.location.href = '${SITE_URL}/properties/${id}';
  <\/script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #1e293b; }
    .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p { font-size: 14px; color: #64748b; margin: 0 0 4px; }
    .badge { display: inline-block; background: #e2e8f0; padding: 4px 12px; border-radius: 999px; font-size: 12px; margin-top: 12px; }
    ${image ? `.preview-img { width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 16px; }` : ''}
  </style>
</head>
<body>
  <div class="card">
    ${image ? `<img src="${image}" alt="${escapeHtml(title)}" class="preview-img" />` : ''}
    ${listingLabel ? `<span class="badge">${listingLabel}</span>` : ''}
    ${typeLabel ? `<span class="badge" style="margin-left:6px">${typeLabel}</span>` : ''}
    <h1>${escapeHtml(title)}</h1>
    ${price ? `<p style="font-size:24px;font-weight:700;color:#2563eb;margin:8px 0">${price}</p>` : ''}
    ${location ? `<p>📍 ${escapeHtml(location)}</p>` : ''}
    <p style="margin-top:16px;font-size:13px;color:#94a3b8">Redirigiendo a Morada...</p>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.status(200).send(html);
  } catch {
    res.redirect(302, `${SITE_URL}/properties/${id}`);
  }
};

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
