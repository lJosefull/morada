import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Inquiry } from '../types'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorAlert } from '../components/ErrorAlert'

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  not_interested: 'Not Interested',
  converted: 'Converted',
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  interested: 'bg-green-100 text-green-800',
  not_interested: 'bg-red-100 text-red-800',
  converted: 'bg-purple-100 text-purple-800',
}

export default function MyInquiriesPage() {
  const { t } = useTranslation()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<{ data: Inquiry[] }>('/inquiries/my-history')
      setInquiries(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">{t('inquiries.myInquiries')}</h1>
          <p className="text-gray-600 mt-1">{t('inquiries.title')}</p>
        </div>
        <Link
          to="/inquiries"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.back')}
        </Link>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchInquiries} className="mb-6" />}

      {inquiries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">{t('inquiries.noInquiries')}</h3>
          <p className="text-gray-500 text-sm mb-4">
            {t('inquiries.noInquiries')}
          </p>
          <Link
            to="/properties"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            {t('property.title')}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  {t('property.title')}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  {t('common.noData')}
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  {t('property.status')}
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  {t('common.view')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {inquiry.property ? (
                      <Link
                        to={`/property/${inquiry.propertyId}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {inquiry.property.title}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-500">{t('property.notFound')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(inquiry.createdAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      statusColors[inquiry.status] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {statusLabels[inquiry.status] || inquiry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/property/${inquiry.propertyId}`}
                      className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                    >
                      {t('common.view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
