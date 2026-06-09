import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'
import { useToastStore } from '../store/toast'
import type { Property, PropertyStats } from '../types'
import { formatCurrency } from '../lib/utils'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { SEOHead } from '../components/SEOHead'
import { PropertyMap } from '../components/PropertyMap'
import { ShareButton } from '../components/ShareButton'
import ContactForm from '../components/ContactForm'
import ReviewSection from '../components/ReviewSection'

const typeIcons: Record<string, string> = {
  house: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  apartment: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  land: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  commercial: 'M21 13.255A23.93 23.93 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
}

export default function PropertyDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const API_BASE = import.meta.env.VITE_API_URL || 'https://morada-api.viewsoft.com.co'
  const passed = location.state as Property | null
  const typeLabels: Record<string, string> = {
    apartment: t('property.propertyType.apartment'),
    house: t('property.propertyType.house'),
    office: t('property.propertyType.office'),
    commercial: t('property.propertyType.commercial'),
    land: t('property.propertyType.land'),
    warehouse: t('property.propertyType.warehouse'),
  }
  const [property, setProperty] = useState<Property | null>(passed)
  const [loading, setLoading] = useState(!passed)
  const [currentImage, setCurrentImage] = useState(0)
  interface DailyView { date: string; views: number }
  const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyView[]>([])
  const [isFavorite, setIsFavorite] = useState(false)

  const addToast = useToastStore((s) => s.addToast)
  const [alsoViewed, setAlsoViewed] = useState<Property[]>([])
  const [isFollowing, setIsFollowing] = useState(false)

  const isOwner = property && user && property.userId === user.id

  const maxDailyViews = useMemo(() => Math.max(...dailyStats.map((d) => d.views), 1), [dailyStats])

  useEffect(() => {
    if (!id) return
    if (!passed) setLoading(true)
    api.get<Property>(`/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .catch(() => {
        if (!passed) setProperty(null)
      })
      .finally(() => setLoading(false))
    
    api.get<Property[]>(`/properties/${id}/also-viewed`)
      .then(({ data }) => setAlsoViewed(data))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!id || !isOwner) return
    api.get<PropertyStats>(`/properties/${id}/stats`)
      .then(({ data }) => setPropertyStats(data))
      .catch(() => {})
    api.get<DailyView[]>(`/properties/${id}/stats/daily`)
      .then(({ data }) => setDailyStats(data.slice(-14)))
      .catch(() => {})
  }, [id, isOwner])

  useEffect(() => {
    if (!id || !user) return
    api.get<Record<string, boolean>>(`/favorites/check?propertyIds=${id}`)
      .then(({ data }) => setIsFavorite(data[id] ?? false))
      .catch(() => {})
    if (property?.userId) {
      api.get<{ following: boolean }>(`/follow/check/${property.userId}`)
        .then(({ data }) => setIsFollowing(data.following))
        .catch(() => {})
    }
  }, [id, user, property?.userId])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('property.notFound')}</h2>
        <Link to="/properties" className="text-blue-600 hover:underline">{t('property.backToProperties')}</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <SEOHead
        title={property.aiTitle || property.title}
        description={property.description.slice(0, 200)}
        image={property.images?.[0]?.url ? (property.images[0].url.startsWith('http') ? property.images[0].url : `${API_BASE}${property.images[0].url}`) : undefined}
        url={`/properties/${property.id}`}
      />
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('property.backToProperties')}
      </Link>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <div
              className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[16/9] group"
              style={{ viewTransitionName: `property-thumb-${property.id}` }}
            >
              {property.images && property.images.length > 0 ? (
                <>
                  <img
                    src={property.images[currentImage].url}
                    alt={`${property.title} - image ${currentImage + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage((i) => (i === 0 ? property.images.length - 1 : i - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImage((i) => (i === property.images.length - 1 ? 0 : i + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {property.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImage(i)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === currentImage ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                        {currentImage + 1} / {property.images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center">
                  <div className="text-center p-12">
                    <svg className="w-20 h-20 mx-auto text-white/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={typeIcons[property.propertyType] || typeIcons.house} />
                    </svg>
                    <p className="text-white/60 text-sm font-medium">{t('property.noImage')}</p>
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  property.listingType === 'sale'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}>
                  {property.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-800 capitalize">
                  {typeLabels[property.propertyType] || property.propertyType}
                </span>
                {property.status && property.status !== 'available' && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    property.status === 'sold' ? 'bg-red-500 text-white' :
                    property.status === 'rented' ? 'bg-purple-500 text-white' :
                    property.status === 'reserved' ? 'bg-amber-500 text-white' :
                    property.status === 'hidden' ? 'bg-gray-500 text-white' :
                    'bg-white/90 text-gray-800'
                  }`}>
                    {property.status === 'sold' ? t('property.sold') :
                     property.status === 'rented' ? t('property.rented') :
                     property.status === 'reserved' ? 'Reserved' :
                     property.status === 'hidden' ? t('property.hidden') :
                     property.status}
                  </span>
                )}
              </div>
            </div>

            {property.images && property.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {property.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImage(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentImage
                        ? 'border-blue-500 opacity-100 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-80'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="min-w-0 flex-1">
                <h1
                  className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2"
                  style={{ viewTransitionName: `property-title-${property.id}` }}
                >
                  {property.aiTitle || property.title}
                </h1>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">{property.location}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className="text-3xl lg:text-4xl font-bold text-blue-600"
                  style={{ viewTransitionName: `property-price-${property.id}` }}
                >
                  {formatCurrency(property.price, property.currency)}
                </p>
                {property.listingType === 'rent' && (
                  <p className="text-sm text-gray-500">{t('property.perMonth')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-700 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-lg font-bold">{property.bedrooms ?? '-'}</span>
                </div>
                <p className="text-xs text-gray-500">{t('property.bedrooms')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-700 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M3 10v11m18-11v11" />
                  </svg>
                  <span className="text-lg font-bold">{property.bathrooms ?? '-'}</span>
                </div>
                <p className="text-xs text-gray-500">{t('property.bathrooms')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-700 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="text-lg font-bold">{property.surface ? `${property.surface}` : '-'}</span>
                </div>
                <p className="text-xs text-gray-500">{t('property.surface')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-700 mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeIcons[property.propertyType] || typeIcons.house} />
                  </svg>
                  <span className="text-lg font-bold capitalize">{typeLabels[property.propertyType] || property.propertyType}</span>
                </div>
                <p className="text-xs text-gray-500">{t('property.type')}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('property.description')}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {property.aiDescription && (
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-sm font-semibold text-blue-900">{t('property.aiDescription')}</p>
                </div>
                <p className="text-blue-800 leading-relaxed text-sm">{property.aiDescription}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('property.location')}</h2>
            {property.latitude && property.longitude ? (
              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                title={property.aiTitle || property.title}
                className="w-full"
              />
            ) : (
              <div className="aspect-[21/9] rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-500">{property.location}</p>
                  {property.latitude && property.longitude && (
                    <p className="text-xs text-gray-400 mt-1">
                      {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 mt-6 lg:mt-0 lg:self-start">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {property.user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  {property.user ? (
                    <Link
                      to={`/agents/${property.user.id}`}
                      className="font-semibold text-gray-900 text-sm truncate hover:text-blue-600 transition-colors block"
                    >
                      {property.user.name || 'Property Owner'}
                    </Link>
                  ) : (
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      Property Owner
                    </p>
                  )}
                  <p className="text-xs text-gray-500">{t('property.contactAgent')}</p>
                </div>
                {!isOwner && user && (
                  <button
                    onClick={async () => {
                      try {
                        const { data } = await api.post<{ following: boolean }>('/follow/toggle', { userId: property.userId })
                        setIsFollowing(data.following)
                        addToast(
                          data.following ? `Following ${property.user?.name || 'agent'}` : 'Unfollowed',
                          data.following ? 'success' : 'info',
                        )
                      } catch { /* ignore */ }
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-medium">{t('property.interested')}</p>
              <a
                href={`mailto:${property.user?.email || 'contact@realestate.com'}?subject=Inquiry about ${property.title}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2.5 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {t('property.sendInquiry')}
              </a>
              {property.user?.phone && (
                <a
                  href={`tel:${property.user.phone}`}
                  className="flex items-center justify-center gap-2 w-full bg-white text-gray-700 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {property.user.phone}
                </a>
              )}
            </div>

            {propertyStats && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('property.viewsThisWeek')}</span>
                  <span className="text-gray-700 font-semibold">{propertyStats.weeklyViews}</span>
                </div>
              </div>
            )}

            {!isOwner && (
              <>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      const token = useAuthStore.getState().accessToken
                      if (!token) {
                        navigate('/login')
                        return
                      }
                      api.post('/favorites/toggle', { propertyId: property.id })
                        .then(() => setIsFavorite(!isFavorite))
                        .catch(() => {})
                    }}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl transition-colors font-medium text-sm ${
                      isFavorite
                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isFavorite ? t('property.savedToFavorites') : t('property.saveToFavorites')}
                  </button>
                </div>
                <div className="mt-3">
                  <ShareButton
                    title={property.aiTitle || property.title}
                    url={`/og/${property.id}`}
                    description={property.description.slice(0, 200)}
                  />
                </div>
              </>
            )}

            {isOwner && propertyStats && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-3">{t('property.propertyDetails')}</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider">Total Views</p>
                    <p className="text-xl font-bold text-blue-900 mt-0.5">{propertyStats.totalViews}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">This Week</p>
                    <p className="text-xl font-bold text-amber-900 mt-0.5">{propertyStats.weeklyViews}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-[10px] text-green-700 font-semibold uppercase tracking-wider">{t('property.inquiries')}</p>
                    <p className="text-xl font-bold text-green-900 mt-0.5">{propertyStats.inquiryCount}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-[10px] text-purple-700 font-semibold uppercase tracking-wider">Daily Avg</p>
                    <p className="text-xl font-bold text-purple-900 mt-0.5">
                      {dailyStats.length > 0
                        ? Math.round(dailyStats.reduce((a, d) => a + d.views, 0) / dailyStats.length)
                        : 0}
                    </p>
                  </div>
                </div>

                {/* Weekly Mini Chart */}
                {dailyStats.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Views (Last 14 days)</p>
                    <div className="flex items-end gap-[3px] h-16">
                      {dailyStats.map((d, i) => {
                        const pct = Math.round((d.views / maxDailyViews) * 100)
                        return (
                          <div
                            key={d.date}
                            className="flex-1 bg-blue-200 hover:bg-blue-400 rounded-t transition-colors relative group cursor-pointer"
                            style={{ height: `${Math.max(pct, 4)}%` }}
                          >
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                              {d.views} views
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {dailyStats.length >= 2 && (
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {dailyStats[dailyStats.length - 1].views > dailyStats[0].views ? '↑ Trending up' : '↓ Trending down'}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => navigate(`/properties/${property.id}/edit`)}
                  className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-2.5 px-4 rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('common.edit')}
                </button>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Property ID</span>
                <span className="text-gray-700 font-mono text-xs">{property.id.slice(0, 13)}...</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Listed on</span>
                <span className="text-gray-700">{new Date(property.createdAt).toLocaleDateString('es-CL')}</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          {!isOwner && (
            <div className="mt-6">
              <ContactForm propertyId={property.id} propertyTitle={property.title} />
            </div>
          )}
        </div>
      </div>

      {/* People also viewed */}
      {alsoViewed.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('peopleAlsoViewed.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alsoViewed.slice(0, 3).map((ap) => (
              <Link
                key={ap.id}
                to={`/properties/${ap.id}`}
                className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200">
                  {ap.images?.[0] && (
                    <img src={ap.images[0].url} alt={ap.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 truncate">{ap.aiTitle || ap.title}</p>
                  <p className="text-blue-600 font-bold text-sm mt-0.5">${ap.price.toLocaleString('es-CL')}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{ap.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews & Ratings Section */}
      <div className="mt-8">
        <ReviewSection
          propertyId={property.id}
          propertyUserId={property.userId}
        />
      </div>
    </div>
  )
}
