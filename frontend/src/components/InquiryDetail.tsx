import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Inquiry } from '../types'
import { LoadingSpinner } from './LoadingSpinner'

interface InquiryDetailProps {
  inquiryId: string
  onClose: () => void
  onStatusChange: (id: string, newStatus: string) => void
}

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  not_interested: 'Not Interested',
  converted: 'Converted',
}

const statusOptions = ['new', 'contacted', 'interested', 'not_interested', 'converted']

export default function InquiryDetail({ inquiryId, onClose, onStatusChange }: InquiryDetailProps) {
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get<Inquiry>(`/inquiries/mine/${inquiryId}`)
      .then(({ data }) => {
        setInquiry(data)
        setNotes(data.notes || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [inquiryId])

  const handleStatusChange = async (newStatus: string) => {
    if (!inquiry || newStatus === inquiry.status) return
    setChangingStatus(true)
    try {
      await api.patch(`/inquiries/mine/${inquiryId}/status`, { status: newStatus })
      onStatusChange(inquiryId, newStatus)
      setInquiry({ ...inquiry, status: newStatus as Inquiry['status'] })
    } catch {
      // silent
    } finally {
      setChangingStatus(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await api.patch(`/inquiries/mine/${inquiryId}/notes`, { notes })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } catch {
      // silent
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
          <LoadingSpinner size="md" />
        </div>
      </div>
    )
  }

  if (!inquiry) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Lead Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm text-gray-900 font-medium">{inquiry.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${inquiry.email}`} className="text-sm text-blue-600 hover:underline">{inquiry.email}</a>
              </div>
              {inquiry.phone && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${inquiry.phone}`} className="text-sm text-blue-600 hover:underline">{inquiry.phone}</a>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Original Message</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">{inquiry.message}</p>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Received {new Date(inquiry.createdAt).toLocaleString('es-CL')}
            </p>
          </div>

          {/* Property Link */}
          {inquiry.property && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Property</h3>
              <Link
                to={`/properties/${inquiry.propertyId}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                onClick={onClose}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {inquiry.property.title}
              </Link>
            </div>
          )}

          {/* Status Change */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((s) => {
                const isActive = inquiry.status === s
                const statusColors: Record<string, string> = {
                  new: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
                  contacted: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
                  interested: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
                  not_interested: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
                  converted: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
                }
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={changingStatus || isActive}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                      isActive
                        ? `${statusColors[s]} ring-2 ring-offset-1 ring-gray-400`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {statusLabels[s] || s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status History */}
          {inquiry.statusHistory && inquiry.statusHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">History</h3>
              <div className="space-y-2">
                {inquiry.statusHistory.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                    <span>
                      Changed from <span className="font-medium text-gray-700">{h.fromStatus}</span> to{' '}
                      <span className="font-medium text-gray-700">{h.toStatus}</span>
                    </span>
                    <span className="text-gray-400">
                      {new Date(h.changedAt).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Internal Notes</h3>
              {notesSaved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Add internal notes about this lead..."
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 bg-gray-900 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
