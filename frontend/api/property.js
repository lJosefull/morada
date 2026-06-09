import { readFileSync } from 'fs'
import { join } from 'path'

const CRAWLERS = /facebookexternalhit|twitterbot|whatsapp|telegram|linkedin|slack|discord|pinterest|slack|googlebot|bingbot/i
const SITE_URL = 'https://morada.viewsoft.com.co'
const API_URL = 'https://morada-api.viewsoft.com.co'

export default async function handler(req, res) {
  const id = req.query?.id
  const ua = req.headers?.['user-agent'] || ''

  const isCrawler = CRAWLERS.test(ua)

  if (!isCrawler) {
    const html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8')
    res.setHeader('content-type', 'text/html; charset=utf-8')
    return res.status(200).send(html)
  }

  if (!id) {
    return res.status(404).send('Not found')
  }

  try {
    const r = await fetch(`${API_URL}/api/properties/${id}`)
    if (!r.ok) throw new Error('Not found')

    const p = await r.json()
    const title = `${p.title} | Morada`
    const desc = (p.description || '').slice(0, 200)
    const img = p.images?.[0]?.url
      ? (p.images[0].url.startsWith('http') ? p.images[0].url : `${API_URL}${p.images[0].url}`)
      : ''
    const url = `${SITE_URL}/properties/${id}`

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${e(title)}</title>
<meta name="description" content="${e(desc)}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(desc)}">
${img ? `<meta property="og:image" content="${e(img)}">` : ''}
<meta property="og:url" content="${e(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Morada">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(title)}">
<meta name="twitter:description" content="${e(desc)}">
${img ? `<meta name="twitter:image" content="${e(img)}">` : ''}
<script>location.href=${JSON.stringify(url)}</script>
</head>
<body></body>
</html>`

    res.setHeader('content-type', 'text/html; charset=utf-8')
    return res.status(200).send(html)
  } catch {
    const html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8')
    res.setHeader('content-type', 'text/html; charset=utf-8')
    return res.status(200).send(html)
  }
}

function e(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
