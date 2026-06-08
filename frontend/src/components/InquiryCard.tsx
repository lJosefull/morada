import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Inquiry } from '../types'

interface InquiryCardProps {
  inquiry: Inquiry
  onClick: () => void
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  interested: 'bg-green-100 text-green-800',
  not_interested: 'bg-red-100 text-red-800',
  converted: 'bg-purple-100 text-purple-800',
}

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  not_interested: 'Not Interested',
  converted: 'Converted',
}

export default function InquiryCard({ inquiry, onClick }: InquiryCardProps) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-gray-900 text-sm truncate">{inquiry.name}</h4>
        {inquiry.status === 'new' && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" title={t('inquiries.new')} />
        )}
      </div>
      <p className="text-xs text-gray-500 mb-1">{inquiry.email}</p>
      {inquiry.property && (
        <p className="text-xs text-gray-400 truncate mb-2">{inquiry.property.title}</p>
      )}
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{inquiry.message}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[inquiry.status] || 'bg-gray-100 text-gray-600'}`}>
          {statusLabels[inquiry.status] || inquiry.status}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(inquiry.createdAt).toLocaleDateString('es-CL')}
        </span>
      </div>
    </button>
  )
}
