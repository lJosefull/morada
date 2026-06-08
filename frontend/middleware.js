const CRAWLERS = /facebookexternalhit|twitterbot|whatsapp|telegram|linkedin|slack|discord|pinterest|slack|googlebot|bingbot/i

const SITE_URL = 'https://morada.viewsoft.com.co'
const API_URL = 'https://morada-api.viewsoft.com.co'

export default async function middleware(req) {
  const url = new URL(req.url)
  const ua = (req.headers.get('user-agent') || '')

  const isCrawler = CRAWLERS.test(ua)
  if (!isCrawler) return

  const match = url.pathname.match(/^\/properties\/([^/]+)/)
  if (!match) return

  const id = match[1]
  try {
    const res = await fetch(`${API_URL}/api/properties/${id}`)
    if (!res.ok) return
    const p = await res.json()

    const title = `${p.title} | Morada`
    const desc = (p.description || '').slice(0, 200)
    const img = p.images?.[0]?.url
      ? (p.images[0].url.startsWith('http') ? p.images[0].url : `${API_URL}${p.images[0].url}`)
      : ''
    const pageUrl = `${SITE_URL}/properties/${id}`

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${e(title)}</title>
<meta name="description" content="${e(desc)}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(desc)}">
${img ? `<meta property="og:image" content="${e(img)}">` : ''}
<meta property="og:url" content="${e(pageUrl)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Morada">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(title)}">
<meta name="twitter:description" content="${e(desc)}">
${img ? `<meta name="twitter:image" content="${e(img)}">` : ''}
<meta http-equiv="refresh" content="0; url=${e(pageUrl)}">
<script>location.href=${JSON.stringify(pageUrl)}</script>
</head>
<body></body>
</html>`

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  } catch { return }
}

function e(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
