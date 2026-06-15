import { useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Property } from '../types'
import { SEOHead } from '../components/SEOHead'
import { Pagination } from '../components/Pagination'
import { formatCurrency } from '../lib/utils'
import AnimatedLink from '../components/AnimatedLink'

type ViewMode = 'grid' | 'list'
type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc'

interface Filters {
  search: string
  listingType: string
  propertyType: string
  minPrice: string
  maxPrice: string
  bedrooms: string
  bathrooms: string
  sort: SortOption
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  listingType: '',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  bathrooms: '',
  sort: 'newest',
}

const PROPERTY_TYPES = [
  { value: '', labelKey: 'search.allTypes' },
  { value: 'house', labelKey: 'property.propertyType.house' },
  { value: 'apartment', labelKey: 'property.propertyType.apartment' },
  { value: 'land', labelKey: 'property.propertyType.land' },
  { value: 'commercial', labelKey: 'property.propertyType.commercial' },
] as const

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: 'newest', labelKey: 'search.newest' },
  { value: 'oldest', labelKey: 'search.oldest' },
  { value: 'price_asc', labelKey: 'search.priceAsc' },
  { value: 'price_desc', labelKey: 'search.priceDesc' },
]

export default function PropertiesPage() {
  const { t } = useTranslation()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const limit = 12

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }, [])

  const activeFiltersCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) => {
        if (key === 'sort') return false
        return value !== '' && value !== 0
      }).length,
    [filters]
  )

  const hasActiveFilters = activeFiltersCount > 0

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, limit }
    if (filters.search) params.search = filters.search
    if (filters.listingType) params.listingType = filters.listingType
    if (filters.propertyType) params.propertyType = filters.propertyType
    if (filters.minPrice) params.minPrice = filters.minPrice
    if (filters.maxPrice) params.maxPrice = filters.maxPrice
    if (filters.bedrooms) params.bedrooms = filters.bedrooms
    if (filters.bathrooms) params.bathrooms = filters.bathrooms
    if (filters.sort && filters.sort !== 'newest') params.sort = filters.sort

    api
      .get<{ data: Property[]; total: number }>('/properties', { params } as any)
      .then(({ data }) => {
        setProperties(data.data || [])
        setTotal(data.total || 0)
      })
      .catch(() => {
        setProperties([])
        setTotal(0)
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.properties')}</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-1">
              {t('search.results')}: <span className="font-semibold text-gray-700">{total}</span>
            </p>
          )}
        </div>
        <Link
          to="/properties/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('property.createTitle')}
        </Link>
      </div>

      {/* YouTube-style Search + Filters Toggle */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-2xl">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={`h-full px-4 border-l border-gray-300 rounded-r-xl transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
                title={t('search.filter')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sort + View Toggle */}
          <div className="flex items-center gap-2">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value as SortOption)}
              className="px-3 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
            <div className="hidden sm:flex border border-gray-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                title={t('common.grid')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                title={t('common.list')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.listingType && (
            <Chip
              label={filters.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
              onRemove={() => updateFilter('listingType', '')}
            />
          )}
          {filters.propertyType && (
            <Chip
              label={
                PROPERTY_TYPES.find((t) => t.value === filters.propertyType)?.labelKey
                  ? t(
                      PROPERTY_TYPES.find((pt) => pt.value === filters.propertyType)
                        ?.labelKey ?? ''
                    )
                  : filters.propertyType
              }
              onRemove={() => updateFilter('propertyType', '')}
            />
          )}
          {filters.minPrice && (
            <Chip
              label={`${t('search.minPrice')}: $${Number(filters.minPrice).toLocaleString('es-CL')}`}
              onRemove={() => updateFilter('minPrice', '')}
            />
          )}
          {filters.maxPrice && (
            <Chip
              label={`${t('search.maxPrice')}: $${Number(filters.maxPrice).toLocaleString('es-CL')}`}
              onRemove={() => updateFilter('maxPrice', '')}
            />
          )}
          {filters.bedrooms && (
            <Chip
              label={`${filters.bedrooms}+ ${t('property.bedrooms')}`}
              onRemove={() => updateFilter('bedrooms', '')}
            />
          )}
          {filters.bathrooms && (
            <Chip
              label={`${filters.bathrooms}+ ${t('property.bathrooms')}`}
              onRemove={() => updateFilter('bathrooms', '')}
            />
          )}
          {filters.search && (
            <Chip label={`"${filters.search}"`} onRemove={() => updateFilter('search', '')} />
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1"
          >
            {t('search.clearFilters')}
          </button>
        </div>
      )}

      {/* Filters Panel (Collapsible) */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Listing Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                {t('property.listingType')}
              </label>
              <div className="flex gap-2">
                {[
                  { value: '', label: t('search.allListings') },
                  { value: 'sale', label: t('property.forSale') },
                  { value: 'rent', label: t('property.forRent') },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateFilter('listingType', opt.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.listingType === opt.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                {t('property.type')}
              </label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateFilter('propertyType', type.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.propertyType === type.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {t(type.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                {t('property.bedrooms')}
              </label>
              <div className="flex gap-2">
                {['', '1', '2', '3', '4', '5'].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateFilter('bedrooms', n)}
                    className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                      filters.bedrooms === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {n || t('common.all')}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                {t('property.bathrooms')}
              </label>
              <div className="flex gap-2">
                {['', '1', '2', '3', '4', '5'].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateFilter('bathrooms', n)}
                    className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                      filters.bathrooms === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {n || t('common.all')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              {t('property.price')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                placeholder={t('search.minPrice')}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                placeholder={t('search.maxPrice')}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2"
            >
              {t('search.clearFilters')}
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} viewMode={viewMode} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('search.noResults')}</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">{t('search.noResultsHint')}</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('search.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results Bar */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>
              {t('search.results')}: <span className="font-semibold text-gray-700">{total}</span>
              {total > limit && (
                <>
                  {' '}— {t('common.page')} {page} {t('common.of')} {totalPages}
                </>
              )}
            </p>
          </div>

          {/* Properties Grid/List */}
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {properties.map((p) =>
              viewMode === 'grid' ? (
                <PropertyGridCard key={p.id} property={p} t={t} />
              ) : (
                <PropertyListCard key={p.id} property={p} t={t} />
              )
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Chip Component ─── */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 ml-0.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}

/* ─── Skeleton Card ─── */
function SkeletonCard({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
        <div className="flex">
          <div className="w-48 h-36 bg-gray-200 shrink-0" />
          <div className="flex-1 p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="flex gap-4">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="flex gap-4">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  )
}

/* ─── Property Grid Card ─── */
function PropertyGridCard({ property: p, t }: { property: Property; t: (key: string) => string }) {
  return (
    <AnimatedLink
      to={`/properties/${p.id}`}
      state={p}
      className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden block group"
    >
      <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center relative overflow-hidden">
        {p.images?.[0] ? (
          <img
            src={p.images[0].url}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-gray-400">{t('property.noImage')}</span>
        )}
        {/* Badge */}
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full ${
            p.listingType === 'sale'
              ? 'bg-blue-500 text-white'
              : 'bg-emerald-500 text-white'
          }`}
        >
          {p.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{p.aiTitle || p.title}</h3>
        <p className="text-lg font-bold text-blue-600 mb-2">
          {formatCurrency(p.price, p.currency)}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{p.location}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {p.bedrooms && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {p.bedrooms}
            </span>
          )}
          {p.bathrooms && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {p.bathrooms}
            </span>
          )}
          {p.surface && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {p.surface} m²
            </span>
          )}
        </div>
        {p.user?.plan === 'agency' && p.user?.agencyName && (
          <p className="text-xs text-purple-600 mt-2 font-medium">{p.user.agencyName}</p>
        )}
      </div>
    </AnimatedLink>
  )
}

/* ─── Property List Card ─── */
function PropertyListCard({ property: p, t }: { property: Property; t: (key: string) => string }) {
  return (
    <AnimatedLink
      to={`/properties/${p.id}`}
      state={p}
      className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all overflow-hidden block group"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-56 h-44 sm:h-auto bg-gradient-to-br from-blue-100 to-indigo-100 shrink-0 relative overflow-hidden">
          {p.images?.[0] ? (
            <img
              src={p.images[0].url}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm">{t('property.noImage')}</span>
            </div>
          )}
          <span
            className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-full ${
              p.listingType === 'sale'
                ? 'bg-blue-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {p.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
          </span>
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{p.aiTitle || p.title}</h3>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {p.location}
            </p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(p.price, p.currency)}
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {p.bedrooms && <span>{p.bedrooms} {t('property.bedrooms')}</span>}
              {p.bathrooms && <span>{p.bathrooms} {t('property.bathrooms')}</span>}
              {p.surface && <span>{p.surface} m²</span>}
            </div>
          </div>
        </div>
      </div>
    </AnimatedLink>
  )
}
