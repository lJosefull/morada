import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const COOKIE_CONSENT_KEY = 'morada-cookie-consent'

interface CookieConsentData {
  accepted: boolean
  timestamp: string
  ip?: string
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!stored) {
      // Small delay so it doesn't appear immediately on page load
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    const data: CookieConsentData = {
      accepted: true,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data))
    setVisible(false)
  }

  const acceptEssential = () => {
    const data: CookieConsentData = {
      accepted: false,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <strong>🍪 Uso de cookies</strong>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Morada utiliza cookies y tecnologías similares para garantizar el funcionamiento
              de la plataforma, mejorar tu experiencia y ofrecerte contenido relevante.
              Consulta nuestra{' '}
              <Link to="/legal/cookies" className="text-blue-600 hover:underline font-medium">
                Política de Cookies
              </Link>{' '}
              para más información.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={acceptEssential}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Solo esenciales
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
