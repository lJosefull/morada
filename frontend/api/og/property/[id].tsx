import { ImageResponse } from '@vercel/og'

export const config = {
  runtime: 'edge',
}

const API_URL = 'https://morada-api.viewsoft.com.co'

export default async function handler(req: Request): Promise<ImageResponse> {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() || 'default'

  let title = 'Encuentra tu propiedad ideal'
  let price = ''
  let location = ''
  let imgUrl = ''

  if (id !== 'default') {
    try {
      const res = await fetch(`${API_URL}/api/properties/${id}`)
      if (res.ok) {
        const property = await res.json()
        title = property.title || title
        price = property.price ? `$${Number(property.price).toLocaleString('es-CL')}` : ''
        location = property.location || ''
        imgUrl = property.images?.[0]?.url
          ? (property.images[0].url.startsWith('http') ? property.images[0].url : `${API_URL}${property.images[0].url}`)
          : ''
      }
    } catch {}
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
          fontFamily: '"Inter", sans-serif',
        }}
      >
        {imgUrl && (
          <img
            src={imgUrl}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
            }}
          />
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            width: '100%',
            padding: '60px',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: '#93c5fd', fontSize: 24, fontWeight: 600, marginLeft: 12 }}>Morada</span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 700, color: 'white', margin: '0 0 8px', lineHeight: 1.2 }}>
            {title}
          </h1>
          {location && (
            <p style={{ fontSize: 24, color: '#bfdbfe', margin: '0 0 8px' }}>{location}</p>
          )}
          {price && (
            <p style={{ fontSize: 36, fontWeight: 700, color: '#fbbf24', margin: 0 }}>{price}</p>
          )}
          {!price && !location && (
            <p style={{ fontSize: 20, color: '#bfdbfe', margin: 0 }}>
              Marketplace inmobiliario inteligente
            </p>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
