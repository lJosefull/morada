import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'

const LEGAL_FILES: Record<string, { title: string; path: string }> = {
  'terms': { title: 'Términos y Condiciones', path: '/legal/terminos-y-condiciones.html' },
  'privacy': { title: 'Política de Privacidad', path: '/legal/politica-de-privacidad.html' },
  'data-policy': { title: 'Política de Tratamiento de Datos', path: '/legal/politica-de-tratamiento-de-datos.html' },
  'cookies': { title: 'Política de Cookies', path: '/legal/politica-de-cookies.html' },
  'acceptable-use': { title: 'Política de Uso Aceptable', path: '/legal/politica-de-uso-aceptable.html' },
  'intellectual-property': { title: 'Política de Propiedad Intelectual', path: '/legal/politica-de-propiedad-intelectual.html' },
  'listing-policy': { title: 'Política de Publicación de Inmuebles', path: '/legal/politica-de-publicacion-de-inmuebles.html' },
  'consent': { title: 'Consentimiento de Datos Personales', path: '/legal/consentimiento-datos-personales.html' },
}

export default function LegalPage() {
  const { t } = useTranslation()
  const { docId } = useParams<{ docId: string }>()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const doc = docId ? LEGAL_FILES[docId] : null

  useEffect(() => {
    if (!doc) {
      setLoading(false)
      setError(true)
      return
    }

    setLoading(true)
    setError(false)

    fetch(doc.path)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.text()
      })
      .then((html) => {
        // Extract the content inside .container to avoid duplicating layout
        const match = html.match(/<div class="container">([\s\S]*)<\/div>\s*<\/body>/)
        if (match) {
          setContent(match[1])
        } else {
          setContent(html)
        }
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [docId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">{t('legal.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('legal.notFound')}</h1>
        <p className="text-gray-500 mb-6">{t('legal.notFoundHint')}</p>
        <Link to="/legal/terms" className="text-blue-600 hover:underline">
          {t('legal.viewTerms')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* In-page navigation */}
      <nav className="mb-6 not-prose">
        <div className="flex flex-wrap gap-2">
          {Object.entries(LEGAL_FILES).map(([key, val]) => (
            <Link
              key={key}
              to={`/legal/${key}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                key === docId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {val.title}
            </Link>
          ))}
        </div>
      </nav>

      {/* Document content */}
      <div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}
