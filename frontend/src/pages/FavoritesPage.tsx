import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Property } from '../types'
import { formatCurrency } from '../lib/utils'
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
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-6">
          {favorites.map((fav) => {
            const p = fav.property
            return (
              <div key={fav.id} className="break-inside-avoid mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group relative">
                  <Link to={`/property/${p.id}`} className="block">
                    {/* Image */}
                    <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0].url}
                          alt={p.title}
                          className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full aspect-[4/3] flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Badge */}
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                          p.listingType === 'sale' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                        }`}
                      >
                        {p.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
                      </span>

                      {/* Price overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 pt-8">
                        <p className="text-white text-xl font-bold drop-shadow-sm">
                          {formatCurrency(p.price, p.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{p.aiTitle || p.title}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {p.location}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 pt-1.5 border-t border-gray-50">
                        {p.propertyType && <span className="capitalize">{p.propertyType}</span>}
                        {p.bedrooms && <span>{p.bedrooms} hab</span>}
                        {p.bathrooms && <span>{p.bathrooms} baño{p.bathrooms > 1 ? 's' : ''}</span>}
                        {p.surface && <span>{p.surface} m²</span>}
                      </div>
                    </div>
                  </Link>

                  {/* Heart button to remove favorite */}
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleToggleFavorite(p.id) }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
                    title={t('favorites.title')}
                  >
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
