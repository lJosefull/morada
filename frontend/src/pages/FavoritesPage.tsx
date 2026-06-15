import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Property } from '../types'
import { PropertyCard } from '../components/PropertyCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorAlert } from '../components/ErrorAlert'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [favorites, setFavorites] = useState<{ id: string; property: Property }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<{ data: { id: string; property: Property }[] }>('/favorites')
      setFavorites(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const handleToggleFavorite = async (propertyId: string) => {
    try {
      await api.post('/favorites/toggle', { propertyId })
      setFavorites((prev) => prev.filter((f) => f.property.id !== propertyId))
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('favorites.title')}</h1>
          <p className="text-gray-600 mt-1">{t('favorites.title')}</p>
        </div>
        {favorites.length > 0 && (
          <p className="text-sm text-gray-500">
            {favorites.length} {t('favorites.title')}
          </p>
        )}
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchFavorites} className="mb-6" />}

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('favorites.empty')}</h3>
          <p className="text-gray-500 mb-4">
            {t('favorites.empty')}
          </p>
          <button
            onClick={() => navigate('/properties')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {t('property.title')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <PropertyCard
              key={fav.id}
              property={fav.property}
              isFavorite={true}
              onToggleFavorite={() => handleToggleFavorite(fav.property.id)}
              onView={() => navigate(`/property/${fav.property.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
