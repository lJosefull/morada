import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Property } from '../types'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { SEOHead } from '../components/SEOHead'
import AnimatedLink from '../components/AnimatedLink'

export default function PropertiesPage() {
  const { t } = useTranslation()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ listingType: '', propertyType: '', search: '' })
  const [loading, setLoading] = useState(true)
  const limit = 12

  useEffect(() => {
    setLoading(true)
    api.get<{ data: Property[]; total: number }>('/properties', {
      params: { ...filters, page, limit },
    } as any)
      .then(({ data }) => {
        setProperties(data.data || [])
        setTotal(data.total || 0)
      })
      .finally(() => setLoading(false))
  }, [page, filters])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <SEOHead
        title="Properties"
        description="Browse our selection of properties for sale and rent. Find your ideal home, apartment, land or commercial property."
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.properties')}</h1>
        <Link
          to="/properties/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + {t('property.createTitle')}
        </Link>
      </div>

      <div className="flex gap-4 flex-wrap">
        <select
          value={filters.listingType}
          onChange={(e) => { setFilters((f) => ({ ...f, listingType: e.target.value })); setPage(1) }}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="">{t('search.allListings')}</option>
          <option value="sale">{t('property.forSale')}</option>
          <option value="rent">{t('property.forRent')}</option>
        </select>
        <select
          value={filters.propertyType}
          onChange={(e) => { setFilters((f) => ({ ...f, propertyType: e.target.value })); setPage(1) }}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="">{t('search.allTypes')}</option>
          <option value="house">{t('property.propertyType.house')}</option>
          <option value="apartment">{t('property.propertyType.apartment')}</option>
          <option value="land">{t('property.propertyType.land')}</option>
          <option value="commercial">{t('property.propertyType.commercial')}</option>
        </select>
        <input
          type="text"
          placeholder={t('common.search')}
          value={filters.search}
          onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1) }}
          className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-gray-500">{t('property.noProperties')}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <AnimatedLink
                key={p.id}
                to={`/properties/${p.id}`}
                state={p}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden block"
              >
                <div
                  className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center"
                  style={{ viewTransitionName: `property-thumb-${p.id}` }}
                >
                  {p.images?.[0] ? (
                    <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400">{t('property.noImage')}</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-blue-600 font-medium uppercase mb-1">
                    {p.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
                  </p>
                  <h3
                    className="font-semibold text-gray-900 mb-1"
                    style={{ viewTransitionName: `property-title-${p.id}` }}
                  >
                    {p.aiTitle || p.title}
                  </h3>
                  <p
                    className="text-lg font-bold text-blue-600 mb-2"
                    style={{ viewTransitionName: `property-price-${p.id}` }}
                  >
                    ${p.price.toLocaleString('es-CL')}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{p.location}</span>
                    {p.bedrooms && <span>{p.bedrooms} {t('property.bedrooms')}</span>}
                    {p.bathrooms && <span>{p.bathrooms} {t('property.bathrooms')}</span>}
                    {p.surface && <span>{p.surface} m²</span>}
                  </div>
                </div>
              </AnimatedLink>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg ${
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
