import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ErrorBoundary from './components/ErrorBoundary'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ToastContainer } from './components/ToastContainer'
import { SEOHead } from './components/SEOHead'
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
const InquiriesPage = lazy(() => import('./pages/InquiriesPage'))
const MyInquiriesPage = lazy(() => import('./pages/MyInquiriesPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const FeedPage = lazy(() => import('./pages/FeedPage'))

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
    <HelmetProvider>
      <ErrorBoundary>
        <SEOHead />
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
            <Route
              path="/inquiries"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<InquiriesPage />} />
              <Route path="history" element={<MyInquiriesPage />} />
            </Route>
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<FeedPage />} />
            </Route>
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<FavoritesPage />} />
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
            <Route path="/agents/:userId" element={<Layout />}>
              <Route index element={<PublicProfilePage />} />
            </Route>
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SettingsPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/properties" replace />} />
            <Route path="*" element={<Navigate to="/properties" replace />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </Router>
    </ErrorBoundary>
    </HelmetProvider>
  )
}

export default App
