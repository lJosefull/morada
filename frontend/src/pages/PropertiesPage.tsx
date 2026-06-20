import { useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    search: searchParams.get('search') || '',
  }))
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

      {/* YouTube-style Search + Filters Toggle + Sort */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Bar — YouTube style */}
          <div className="relative flex-1 max-w-2xl group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-11 pr-14 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm sm:text-base placeholder:text-gray-400 transition-all"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              {/* Clear button */}
              {filters.search && (
                <button
                  onClick={() => updateFilter('search', '')}
                  className="h-full px-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={`h-full px-3 sm:px-4 border-l transition-all duration-200 ${
                  showFilters || hasActiveFilters
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                } ${filters.search ? 'rounded-r-xl' : 'rounded-r-xl'}`}
                title={t('search.filter')}
              >
                <div className="relative">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {hasActiveFilters && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Sort + View Toggle — desktop row */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Custom sort select */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value as SortOption)}
                className="appearance-none pl-3 pr-8 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white cursor-pointer transition-all"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* View toggle */}
            <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={t('common.grid')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={t('common.list')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile sort + filter row */}
          <div className="flex sm:hidden items-center gap-2">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value as SortOption)}
              className="appearance-none pl-3 pr-7 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {viewMode === 'grid' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 animate-[fadeIn_0.3s_ease]">
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
            className="text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            {t('search.clearFilters')}
          </button>
        </div>
      )}

      {/* Filters Panel (Collapsible) — redesigned */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-100/50 p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{t('search.filter')}</h3>
                <p className="text-xs text-gray-400">{t('search.noResultsHint')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
            {/* Listing Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('property.listingType')}
              </label>
              <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl">
                {[
                  { value: '', label: t('search.allListings'), icon: null },
                  { value: 'sale', label: t('property.forSale'), icon: null },
                  { value: 'rent', label: t('property.forRent'), icon: null },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateFilter('listingType', opt.value)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      filters.listingType === opt.value
                        ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Type — pill selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {t('property.type')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateFilter('propertyType', type.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      filters.propertyType === type.value
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
                    }`}
                  >
                    {t(type.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('property.bedrooms')}
              </label>
              <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl">
                {['', '1', '2', '3', '4', '5+'].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateFilter('bedrooms', n === '5+' ? '5' : n)}
                    className={`flex-1 w-9 h-9 text-sm font-medium rounded-lg transition-all duration-200 ${
                      filters.bedrooms === (n === '5+' ? '5' : n)
                        ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {n || t('common.all')}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('property.bathrooms')}
              </label>
              <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl">
                {['', '1', '2', '3', '4', '5+'].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateFilter('bathrooms', n === '5+' ? '5' : n)}
                    className={`flex-1 w-9 h-9 text-sm font-medium rounded-lg transition-all duration-200 ${
                      filters.bathrooms === (n === '5+' ? '5' : n)
                        ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {n || t('common.all')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider sm:w-32 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('property.price')}
              </label>
              <div className="flex-1 flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm font-medium">$</span>
                  </div>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    placeholder={`${t('search.minPrice')}`}
                    min="0"
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm font-medium">$</span>
                  </div>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    placeholder={t('search.maxPrice')}
                    min="0"
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions footer */}
          {hasActiveFilters && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => { clearFilters(); setShowFilters(false) }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('search.clearFilters')}
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
              >
                {t('common.view')} {total} {t('search.results')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'columns-1 sm:columns-2 lg:columns-3 gap-x-6'
              : 'space-y-4'
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-6">
              <SkeletonCard viewMode={viewMode} />
            </div>
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
                ? 'columns-1 sm:columns-2 lg:columns-3 gap-x-6 [column-fill:_balance]'
                : 'space-y-4'
            }
          >
            {properties.map((p) =>
              viewMode === 'grid' ? (
                <div key={p.id} className="break-inside-avoid mb-6">
                  <PropertyGridCard property={p} t={t} />
                </div>
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
    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200/60 shadow-sm shadow-blue-100/50 animate-[fadeIn_0.2s_ease]">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-blue-200/60 text-blue-400 hover:text-blue-700 transition-colors"
      >
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="w-full aspect-[4/3] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-3 pt-1.5 border-t border-gray-50">
          <div className="h-3 bg-gray-200 rounded w-12" />
          <div className="h-3 bg-gray-200 rounded w-12" />
          <div className="h-3 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  )
}

/* ─── Property Grid Card (Pinterest-style Masonry) ─── */
function PropertyGridCard({ property: p, t }: { property: Property; t: (key: string) => string }) {
  return (
    <AnimatedLink
      to={`/property/${p.id}`}
      state={p}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden block group"
    >
      {/* Image — variable height, dominant */}
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

        {/* Listing type badge — top right */}
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
            p.listingType === 'sale'
              ? 'bg-emerald-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {p.listingType === 'sale' ? t('property.forSale') : t('property.forRent')}
        </span>

        {/* Price overlay — bottom left over image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 pt-8">
          <p className="text-white text-xl font-bold drop-shadow-sm">
            {formatCurrency(p.price, p.currency)}
          </p>
        </div>
      </div>

      {/* Minimal info below image */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
          {p.aiTitle || p.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{p.location}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 pt-1.5 border-t border-gray-50">
          {p.propertyType && (
            <span className="capitalize">{p.propertyType}</span>
          )}
          {p.bedrooms && (
            <span>{p.bedrooms} hab</span>
          )}
          {p.bathrooms && (
            <span>{p.bathrooms} baño{p.bathrooms > 1 ? 's' : ''}</span>
          )}
          {p.surface && (
            <span>{p.surface} m²</span>
          )}
        </div>
      </div>
    </AnimatedLink>
  )
}

/* ─── Property List Card ─── */
function PropertyListCard({ property: p, t }: { property: Property; t: (key: string) => string }) {
  return (
    <AnimatedLink
      to={`/property/${p.id}`}
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
