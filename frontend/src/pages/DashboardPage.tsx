import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'
import type { Property, InquiryStats } from '../types'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PropertyCard } from '../components/PropertyCard'

type TimeGreeting = 'Good morning' | 'Good afternoon' | 'Good evening'

function getGreeting(): TimeGreeting {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const statusConfig = [
  { key: 'new' as const, label: 'New', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: 'contacted' as const, label: 'Contacted', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  { key: 'interested' as const, label: 'Interested', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  { key: 'not_interested' as const, label: 'Not Interested', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  { key: 'converted' as const, label: 'Converted', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
]

function getStatusValue(stats: InquiryStats, key: string): number {
  if (key === 'new') return stats.new
  if (key === 'contacted') return stats.contacted
  if (key === 'interested') return stats.interested
  if (key === 'not_interested') return stats.not_interested
  if (key === 'converted') return stats.converted
  return 0
}

function StatCard({ label, value, highlight, icon, trend }: {
  label: string
  value: string | number
  highlight?: boolean
  icon: React.ReactNode
  trend?: { direction: 'up' | 'down' | 'neutral'; text: string }
}) {
  return (
    <div className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1.5 font-medium">{label}</p>
          <p className={`text-2xl font-bold tracking-tight ${highlight ? 'text-blue-600' : value === 0 || value === '—' ? 'text-gray-400' : 'text-gray-900'}`}>
            {value}
          </p>
          {trend && (
            <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${
              trend.direction === 'up' ? 'text-green-600' :
              trend.direction === 'down' ? 'text-red-500' : 'text-gray-400'
            }`}>
              <span>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}</span>
              {trend.text}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, total, color, bgColor, textColor }: {
  label: string
  value: number
  total: number
  color: string
  bgColor: string
  textColor: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
      <span className="text-sm text-gray-500 flex-1">{label}</span>
      <div className="flex-1 max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-semibold w-8 text-right ${value > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
        {value}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, accessToken } = useAuthStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inquiryStats, setInquiryStats] = useState<InquiryStats | null>(null)
  const [greeting] = useState<TimeGreeting>(getGreeting)

  useEffect(() => {
    if (!accessToken) {
      navigate('/login', { replace: true })
      return
    }
    fetchData()
  }, [accessToken])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [propsRes, statsRes] = await Promise.all([
        api.get<{ data: Property[]; total: number }>('/properties/mine'),
        api.get<InquiryStats>('/inquiries/stats').catch(() => null),
      ])
      setProperties(propsRes.data.data)
      if (statsRes) setInquiryStats(statsRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/properties/${id}`)
      setProperties((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete property')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  const totalLeads = inquiryStats?.total ?? 0
  const hasLeads = totalLeads > 0

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.name?.split(' ')[0] || 'User'}</h1>
            <p className="text-sm text-gray-500">{t('dashboard.recentActivity')}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/properties/new')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('nav.newProperty')}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 px-5 py-3.5 rounded-xl text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="font-medium hover:underline text-sm">{t('common.close')}</button>
        </div>
      )}

      {/* ── Quick Stats ── */}
      {inquiryStats && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentActivity')}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={t('dashboard.totalInquiries')}
              value={inquiryStats.total}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              trend={hasLeads ? { direction: 'up', text: `${inquiryStats.new} ${t('inquiries.new')}` } : { direction: 'neutral', text: t('dashboard.noActivity') }}
            />
            <StatCard
              label={t('dashboard.newInquiries')}
              value={inquiryStats.new}
              highlight={inquiryStats.new > 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            />
            <StatCard
              label={t('profile.properties')}
              value={properties.length}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
            />
            <StatCard
              label={t('inquiries.title')}
              value={hasLeads ? `${inquiryStats.conversionRate}%` : '—'}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              trend={hasLeads ? { direction: inquiryStats.conversionRate >= 50 ? 'up' : 'down', text: `${inquiryStats.converted} ${t('inquiries.closed')}` } : undefined}
            />
          </div>
        </section>
      )}

      {/* ── Leads by Status ── */}
      {inquiryStats && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">{t('inquiries.title')}</h2>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {hasLeads ? (
              <div className="p-6">
                <div className="space-y-1">
                  {statusConfig.map((s) => (
                    <MetricCard
                      key={s.key}
                      label={s.label}
                      value={getStatusValue(inquiryStats, s.key)}
                      total={totalLeads}
                      color={s.color}
                      bgColor={s.bgColor}
                      textColor={s.textColor}
                    />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>{totalLeads} {t('inquiries.title')}</span>
                  <span>100%</span>
                </div>
              </div>
            ) : (
              <div className="py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">{t('inquiries.noInquiries')}</p>
                <p className="text-gray-400 text-sm mt-1.5 max-w-sm mx-auto">
                  {t('inquiries.noInquiries')}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Quick Actions ── */}
      {inquiryStats && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.quickActions')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/inquiries')}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{t('dashboard.viewProperties')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('inquiries.title')}</p>
            </button>
            <button
              onClick={() => navigate('/properties/new')}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-green-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{t('nav.newProperty')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('property.title')}</p>
            </button>
            <button
              onClick={() => navigate('/properties')}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{t('property.title')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('property.title')}</p>
            </button>
          </div>
        </section>
      )}

      {/* ── Properties ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">{t('profile.properties')}</h2>
            {properties.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{properties.length}</span>
            )}
          </div>
          {properties.length > 0 && (
            <button
              onClick={() => navigate('/properties')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              {t('common.viewAll')}
            </button>
          )}
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('property.noProperties')}</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              {t('property.noProperties')}
            </p>
            <button
              onClick={() => navigate('/properties/new')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('nav.newProperty')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onView={() => navigate(`/properties/${p.id}`)}
                onEdit={() => navigate(`/properties/${p.id}/edit`)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
