import { Helmet } from 'react-helmet-async'

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://morada.viewsoft.com.co'
const SITE_NAME = 'Morada'
const DEFAULT_DESCRIPTION = 'Marketplace inmobiliario inteligente — encuentra la propiedad ideal con Morada'

interface SEOHeadProps {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function SEOHead({ title, description, image, url }: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const desc = description || DEFAULT_DESCRIPTION
  const ogUrl = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : SITE_URL

  const ogImage = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : undefined

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  )
}
