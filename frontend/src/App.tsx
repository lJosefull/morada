import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useAuthStore } from './store/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'))
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'))
const CreatePropertyPage = lazy(() => import('./pages/CreatePropertyPage'))
const EditPropertyPage = lazy(() => import('./pages/EditPropertyPage'))

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" message="Loading..." />
  </div>
)

const App: React.FC = () => {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const fetchUser = useAuthStore((s) => s.fetchUser)

  useEffect(() => {
    if (accessToken && !user) fetchUser()
  }, [accessToken]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
            </Route>
            <Route path="/properties" element={<Layout />}>
              <Route index element={<PropertiesPage />} />
              <Route path=":id" element={<PropertyDetailPage />} />
            </Route>
            <Route
              path="/properties/new"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CreatePropertyPage />} />
            </Route>
            <Route
              path="/properties/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<EditPropertyPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/properties" replace />} />
            <Route path="*" element={<Navigate to="/properties" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  )
}

export default App
