import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { LoadingSpinner } from '../components/LoadingSpinner'

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const fetchUser = useAuthStore((s) => s.fetchUser)

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login', { replace: true })
      return
    }

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken)
      fetchUser().finally(() => {
        navigate('/dashboard', { replace: true })
      })
    } else {
      navigate('/login', { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <LoadingSpinner size="lg" message="Iniciando sesión..." />
    </div>
  )
}

export default AuthCallbackPage
