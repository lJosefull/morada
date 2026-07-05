import React, { useState, useRef, useEffect, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/auth'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { SEOHead } from '../components/SEOHead'

const apiBase = import.meta.env.VITE_API_URL || ''

const RegisterPage: React.FC = () => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptDataTreatment, setAcceptDataTreatment] = useState(false)
  const [acceptCommercial, setAcceptCommercial] = useState(false)
  const [altchaPayload, setAltchaPayload] = useState('')
  const altchaRef = useRef<HTMLDivElement>(null)

  const { register, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const el = altchaRef.current?.querySelector('altcha-widget')
    if (!el) return
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setAltchaPayload(detail?.payload || '')
    }
    el.addEventListener('change', handler)
    return () => el.removeEventListener('change', handler)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()

    if (!acceptTerms || !acceptDataTreatment) {
      return
    }

    if (!altchaPayload) return

    try {
      const consentData = {
        acceptTerms: { value: acceptTerms, timestamp: new Date().toISOString() },
        acceptDataTreatment: { value: acceptDataTreatment, timestamp: new Date().toISOString() },
        acceptCommercial: { value: acceptCommercial, timestamp: new Date().toISOString() },
        ip: 'collected-at-server',
        userAgent: navigator.userAgent,
      }
      localStorage.setItem('morada-consent-' + email, JSON.stringify(consentData))

      await register({ email, password, name, altcha: altchaPayload })
      navigate('/', { replace: true })
    } catch {
      // Error handled by store
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-100/80" />
      <div
        className="absolute inset-0 bg-no-repeat bg-center bg-cover opacity-40"
        style={{ backgroundImage: "image-set(url('/bg-login-morada.webp') type('image/webp'), url('/bg-login-morada.png') type('image/png'))" }}
      />
      <div className="relative z-10 w-full max-w-md">
      <SEOHead title={t('auth.registerTitle')} description={t('auth.registerSubtitle')} />
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{t('auth.registerTitle')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('auth.registerSubtitle')}</p>
        </div>

        <a
          href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.continueWithGoogle')}
        </a>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t('common.or')}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('auth.name')}</label>
              <input id="name" name="name" type="text" required
                value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="John Doe" disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('auth.email')}</label>
              <input id="email" name="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="you@example.com" disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Min 6 characters" disabled={isLoading}
              />
            </div>
          </div>

          {/* Legal consent checkboxes */}
          <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-xs text-gray-600">
                He leído y acepto los{' '}
                <a href="/legal/terms" target="_blank" className="text-blue-600 hover:underline font-medium">
                  Términos y Condiciones
                </a>{' '}
                de Morada. <span className="text-red-500">*</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptDataTreatment}
                onChange={(e) => setAcceptDataTreatment(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-xs text-gray-600">
                Autorizo el tratamiento de mis datos personales conforme a la{' '}
                <a href="/legal/data-policy" target="_blank" className="text-blue-600 hover:underline font-medium">
                  Política de Tratamiento de Datos
                </a>{' '}
                de Morada. <span className="text-red-500">*</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptCommercial}
                onChange={(e) => setAcceptCommercial(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">
                Acepto recibir comunicaciones comerciales y promociones de Morada por correo
                electrónico (opcional).
              </span>
            </label>
          </div>

          {(!acceptTerms || !acceptDataTreatment) && (
            <p className="text-xs text-amber-600 text-center">
              Debes aceptar los Términos y Condiciones y la Política de Tratamiento de Datos para
              registrarte.
            </p>
          )}

          <div ref={altchaRef}>
            <altcha-widget
              challengeurl={`${apiBase}/api/auth/altcha-challenge`}
              style="--altcha-max-width: 100%;"
            ></altcha-widget>
          </div>

          <button
            type="submit"
            disabled={isLoading || !acceptTerms || !acceptDataTreatment || !altchaPayload}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : t('auth.registerButton')}
          </button>

          <p className="text-center text-sm text-gray-600">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('auth.loginButton')}
            </Link>
          </p>
        </form>
      </div>
    </div>
    </div>
  )
}

export default RegisterPage
