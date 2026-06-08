export const config = {
  matcher: '/properties/:id',
}

const CRAWLERS = /facebookexternalhit|facebook|crawler|twitterbot|whatsapp|telegram|slack|discord|pinterest|linkedin|googlebot|bingbot|slurp|yandex|baiduspider|duckduckbot|embedly|quora|outbrain|flipboard|tumblr|bitly|buffer|pocket|newsblur|hatena|evernote|instapaper|seesaw/i

const SITE_URL = 'https://morada.viewsoft.com.co'
const API_URL = 'https://morada-api.viewsoft.com.co'

export default async function middleware(req: Request): Promise<Response | undefined> {
  const url = new URL(req.url)
  const ua = req.headers.get('user-agent') || ''

  if (!CRAWLERS.test(ua)) return

  const id = url.pathname.replace('/properties/', '')?.split('/')?.[0]
  if (!id) return

  try {
    const res = await fetch(`${API_URL}/api/properties/${id}`)
    if (!res.ok) return
    const property = await res.json()

    const title = `${property.title} | Morada`
    const desc = (property.description || '').slice(0, 200)
    const rawImg = property.images?.[0]?.url || ''
    const img = rawImg ? (rawImg.startsWith('http') ? rawImg : `${API_URL}${rawImg}`) : ''
    const absoluteUrl = `${SITE_URL}/properties/${id}`

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${e(title)}</title>
  <meta name="description" content="${e(desc)}">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(desc)}">
  ${img ? `<meta property="og:image" content="${e(img)}">` : ''}
  <meta property="og:url" content="${e(absoluteUrl)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Morada">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(title)}">
  <meta name="twitter:description" content="${e(desc)}">
  ${img ? `<meta name="twitter:image" content="${e(img)}">` : ''}
  <meta http-equiv="refresh" content="0; url=${e(absoluteUrl)}">
</head>
<body>
  <script>location.href=${JSON.stringify(absoluteUrl)}</script>
</body>
</html>`

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  } catch {
    return
  }
}

function e(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
