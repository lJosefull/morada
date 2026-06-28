import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SEOHead } from '../components/SEOHead'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { api } from '../lib/api'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error' | 'resent'>('idle')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) return
    setStatus('verifying')
    api.post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success')
        setMessage('¡Correo verificado exitosamente! Ya puedes publicar propiedades.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.response?.data?.message || 'El enlace de verificación es inválido o expiró.')
      })
  }, [token])

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    try {
      await api.post('/auth/resend-verification', { email })
      setStatus('resent')
      setMessage('Correo de verificación reenviado. Revisa tu bandeja de entrada.')
    } catch {
      setMessage('Error al reenviar. Intenta de nuevo más tarde.')
    } finally {
      setResending(false)
    }
  }

  if (!token && !email) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <SEOHead title="Verificar correo" description="Verificación de correo electrónico" />
          <p className="text-gray-500">Enlace de verificación inválido.</p>
          <Link to="/login" className="text-blue-600 hover:underline mt-4 inline-block">Ir a iniciar sesión</Link>
        </div>
      </div>
    )
  }

  if (token && status === 'verifying') {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <LoadingSpinner size="lg" message="Verificando correo..." />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <SEOHead title="Verificar correo" description="Verificación de correo electrónico" />
        {token && status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Correo verificado!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/login" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium">
              Iniciar sesión
            </Link>
          </>
        )}
        {token && status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error de verificación</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/login" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium">
              Ir a iniciar sesión
            </Link>
          </>
        )}
        {email && !token && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
            <p className="text-gray-600 mb-2">
              Hemos enviado un enlace de verificación a <strong>{email}</strong>.
            </p>
            <p className="text-gray-500 text-sm mb-6">Si no lo encuentras, revisa la carpeta de spam.</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
            >
              {resending ? 'Reenviando...' : 'Reenviar correo'}
            </button>
            <div className="mt-6">
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                Volver a iniciar sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
