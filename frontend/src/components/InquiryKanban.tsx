import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Inquiry } from '../types'
import InquiryCard from './InquiryCard'
import InquiryDetail from './InquiryDetail'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorAlert } from './ErrorAlert'

interface Column {
  id: string
  title: string
  color: string
}

const columns: Column[] = [
  { id: 'new', title: 'New', color: 'border-blue-500' },
  { id: 'contacted', title: 'Contacted', color: 'border-amber-500' },
  { id: 'interested', title: 'Interested', color: 'border-green-500' },
  { id: 'not_interested', title: 'Not Interested', color: 'border-red-500' },
  { id: 'converted', title: 'Converted', color: 'border-purple-500' },
]

export default function InquiryKanban() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<{ data: Inquiry[] }>('/inquiries/mine')
      setInquiries(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  const getInquiriesByStatus = (status: string) =>
    inquiries.filter((i) => i.status === status)

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    setInquiries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus as Inquiry['status'] } : i))
    )
    setSelectedInquiryId(null)
  }

  const handleDragStart = (e: React.DragEvent, inquiryId: string) => {
    e.dataTransfer.setData('text/plain', inquiryId)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(null)
    const inquiryId = e.dataTransfer.getData('text/plain')
    const inquiry = inquiries.find((i) => i.id === inquiryId)
    if (!inquiry || inquiry.status === columnId) return

    // Optimistic update
    setInquiries((prev) =>
      prev.map((i) => (i.id === inquiryId ? { ...i, status: columnId as Inquiry['status'] } : i))
    )

    try {
      await api.patch(`/inquiries/mine/${inquiryId}/status`, { status: columnId })
    } catch {
      // Revert on error
      setInquiries((prev) =>
        prev.map((i) => (i.id === inquiryId ? { ...i, status: inquiry.status } : i))
      )
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={fetchInquiries} />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {inquiries.length} total lead{inquiries.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={fetchInquiries}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnInquiries = getInquiriesByStatus(column.id)
          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-72 bg-gray-50 rounded-xl border-t-4 ${column.color} ${
                dragOverColumn === column.id ? 'bg-blue-50 ring-2 ring-blue-300' : ''
              } transition-all`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">{column.title}</h3>
                  <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {columnInquiries.length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {columnInquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-xs">Drop leads here</p>
                  </div>
                ) : (
                  columnInquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, inquiry.id)}
                    >
                      <InquiryCard
                        inquiry={inquiry}
                        onClick={() => setSelectedInquiryId(inquiry.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedInquiryId && (
        <InquiryDetail
          inquiryId={selectedInquiryId}
          onClose={() => setSelectedInquiryId(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
