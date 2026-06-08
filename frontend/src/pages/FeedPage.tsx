import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Property } from '../types'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { SEOHead } from '../components/SEOHead'
import { useAuthStore } from '../store/auth'
import { Link } from 'react-router-dom'

interface FeedProperty extends Property {
  score: number
  matchReasons: string[]
}

interface FeedProfile {
  topPropertyType: string | null
  topListingType: string | null
  avgPrice: number | null
  preferredBedrooms: number | null
  preferredBathrooms: number | null
  totalInteractions: number
}

export default function FeedPage() {
  const { t } = useTranslation()
  const [properties, setProperties] = useState<FeedProperty[]>([])
  const [profile, setProfile] = useState<FeedProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const user = useAuthStore((s) => s.user)
  const limit = 12

  useEffect(() => {
    setLoading(true)
    api.get<{ data: FeedProperty[]; total: number; page: number; limit: number; profile: FeedProfile }>('/properties/feed', {
      params: { page, limit },
    } as any)
      .then(({ data }) => {
        setProperties(data.data || [])
        setTotal(data.total || 0)
        setProfile(data.profile || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const reasonColors: Record<string, string> = {
    'very close to your area': 'bg-green-100 text-green-700',
    'near your area': 'bg-teal-100 text-teal-700',
    'within your usual price range': 'bg-blue-100 text-blue-700',
    'similar to your interest in': 'bg-purple-100 text-purple-700',
  }

  const getReasonStyle = (reason: string) => {
    for (const [key, cls] of Object.entries(reasonColors)) {
      if (reason.startsWith(key)) return cls
    }
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <SEOHead title={t('nav.feed')} description="Personalized property recommendations based on your preferences." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.feed')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('feed.subtitle')}
            {profile && profile.totalInteractions > 0 && (
              <span> — {profile.totalInteractions} interactions analyzed</span>
            )}
          </p>
        </div>
      </div>

      {/* Profile insights card */}
      {profile && profile.totalInteractions > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm font-semibold text-blue-900">{t('feed.yourPreferences')}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {profile.topPropertyType && (
              <span className="px-3 py-1.5 bg-white rounded-lg border border-blue-100 text-blue-700 font-medium capitalize">
                {profile.topPropertyType}s
              </span>
            )}
            {profile.topListingType && (
              <span className="px-3 py-1.5 bg-white rounded-lg border border-blue-100 text-blue-700 font-medium">
                {profile.topListingType === 'sale' ? t('property.forSale') : t('property.forRent')}
              </span>
            )}
            {profile.preferredBedrooms && (
              <span className="px-3 py-1.5 bg-white rounded-lg border border-blue-100 text-blue-700 font-medium">
                {profile.preferredBedrooms} {t('property.bedrooms')}
              </span>
            )}
            {profile.preferredBathrooms && (
              <span className="px-3 py-1.5 bg-white rounded-lg border border-blue-100 text-blue-700 font-medium">
                {profile.preferredBathrooms} {t('property.bathrooms')}
              </span>
            )}
            {profile.avgPrice && (
              <span className="px-3 py-1.5 bg-white rounded-lg border border-blue-100 text-blue-700 font-medium">
                {t('feed.avgPrice')}: ${Math.round(profile.avgPrice).toLocaleString()}
              </span>
            )}
            {profile.totalInteractions === 0 && (
              <span className="text-blue-500 text-xs">
                {t('feed.startBrowsing')}
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-500 mt-4">{t('feed.noRecommendations')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('feed.noRecommendationsHint')}</p>
          <Link to="/properties" className="inline-block mt-4 text-blue-600 hover:underline text-sm font-medium">
            {t('feed.browseProperties')}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <Link
                key={p.id}
                to={`/properties/${p.id}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {p.images?.[0] ? (
                    <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                      p.listingType === 'sale' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {p.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
                    </span>
                  </div>
                  {/* Match score badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-bold text-blue-600 shadow-sm">
                    {Math.round(p.score * 100)}% {t('feed.matched')}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{p.aiTitle || p.title}</h3>
                  <p className="text-lg font-bold text-blue-600 mt-1">${p.price.toLocaleString('es-CL')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.location}</p>

                  {/* Match reasons */}
                  {p.matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.matchReasons.slice(0, 2).map((reason, i) => (
                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getReasonStyle(reason)}`}>
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
                    {p.bedrooms && <span>{p.bedrooms} {t('property.bedrooms')}</span>}
                    {p.bathrooms && <span>{p.bathrooms} {t('property.bathrooms')}</span>}
                    {p.surface && <span>{p.surface} m²</span>}
                    <span className="capitalize">{p.propertyType}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {total > limit && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    page === p ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
