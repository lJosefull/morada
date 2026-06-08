import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Review } from '../types'
import StarRating from './StarRating'

interface ReviewFormProps {
  propertyId: string
  mode: 'create' | 'edit'
  existingReview?: Review
  onSuccess: () => void
}

type FormStatus = 'idle' | 'sending' | 'success' | 'error'

export default function ReviewForm({ propertyId, mode, existingReview, onSuccess }: ReviewFormProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setErrorMsg(t('reviews.writeReview'))
      return
    }
    if (comment.length < 10) {
      setErrorMsg(t('reviews.writeReview'))
      return
    }

    setStatus('sending')
    setErrorMsg('')

    try {
      if (mode === 'create') {
        await api.post(`/properties/${propertyId}/reviews`, { rating, comment })
      } else {
        await api.patch(`/properties/${propertyId}/reviews/mine`, { rating, comment })
      }
      setStatus('success')
      onSuccess()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit review')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-3">
        <svg className="w-8 h-8 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium text-green-700">
          {t('common.submit')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('reviews.rating')}
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onChange={setRating}
        />
        {rating === 0 && (
          <p className="text-xs text-gray-400 mt-1">{t('reviews.rating')}</p>
        )}
      </div>

      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">
          {t('reviews.yourReview')}
        </label>
        <textarea
          id="review-comment"
          required
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
          placeholder={t('reviews.yourReview')}
          minLength={10}
          maxLength={1000}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {comment.length}/1000
        </p>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
      >
        {status === 'sending' ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('common.loading')}
          </>
        ) : (
          mode === 'create' ? t('reviews.submitReview') : t('common.save')
        )}
      </button>
    </form>
  )
}
