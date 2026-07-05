import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useToastStore } from '../store/toast';
import type { Review, ReviewStats } from '../types';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { LoadingSpinner } from './LoadingSpinner';

interface ReviewSectionProps {
  propertyId: string;
  propertyUserId: string;
}

export default function ReviewSection({ propertyId, propertyUserId }: ReviewSectionProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const limit = 10;

  const isOwner = !!user && user.id === propertyUserId;
  const canReview = !!user && !isOwner;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.get<{ data: Review[]; total: number; page: number; limit: number }>(
          `/properties/${propertyId}/reviews`,
          { params: { page, limit } } as any,
        ),
        api.get<ReviewStats>(`/properties/${propertyId}/reviews/stats`),
      ]);
      setReviews(reviewsRes.data.data);
      setTotal(reviewsRes.data.total);
      setStats(statsRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [propertyId, page]);

  const fetchMyReview = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<Review>(`/properties/${propertyId}/reviews/mine`);
      setMyReview(res.data);
    } catch {
      setMyReview(null);
    }
  }, [propertyId, user]);

  useEffect(() => {
    fetchReviews();
    fetchMyReview();
  }, [fetchReviews, fetchMyReview]);

  const handleReviewSubmitted = () => {
    fetchReviews();
    fetchMyReview();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('reviews.title')}</h2>

      {loading && !stats ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : stats && stats.total > 0 ? (
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 mb-8">
          {/* Left: Average */}
          <div className="text-center lg:text-left mb-6 lg:mb-0">
            <div className="text-5xl font-bold text-gray-900 mb-1">{stats.average.toFixed(1)}</div>
            <div className="flex justify-center lg:justify-start mb-1">
              <StarRating rating={Math.round(stats.average)} size="md" />
            </div>
            <p className="text-sm text-gray-500">
              {stats.total} {t('reviews.title')}
            </p>
          </div>

          {/* Right: Distribution bars */}
          <div className="lg:col-span-2 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] ?? 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-right text-gray-600 font-medium">{star}★</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-gray-500 tabular-nums">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 mb-6">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <p className="text-gray-500 font-medium">{t('reviews.noReviews')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('reviews.noReviews')}</p>
        </div>
      )}

      {/* Review Form */}
      {canReview && !myReview && (
        <div className="mb-8 border border-gray-200 rounded-xl p-5 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900 mb-3">{t('reviews.writeReview')}</h3>
          <ReviewForm propertyId={propertyId} mode="create" onSuccess={handleReviewSubmitted} />
        </div>
      )}

      {/* My existing review - Edit/Delete */}
      {canReview && myReview && (
        <div className="mb-8 border border-blue-200 rounded-xl p-5 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-blue-900">{t('reviews.yourReview')}</h3>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  api
                    .delete(`/properties/${propertyId}/reviews/mine` as any)
                    .then(() => {
                      handleReviewSubmitted();
                      addToast(t('common.delete'), 'success');
                    })
                    .catch(() => addToast(t('common.error'), 'error'))
                }
                className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
          <ReviewForm
            propertyId={propertyId}
            mode="edit"
            existingReview={myReview}
            onSuccess={handleReviewSubmitted}
          />
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">
            {t('reviews.title')} ({total})
          </h3>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwner={isOwner}
              propertyId={propertyId}
              onReplyChanged={fetchReviews}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                {t('common.previous')}
              </button>
              <span className="text-sm text-gray-500 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      )}

      {!user && (
        <div className="mt-6 text-center text-sm text-gray-500">
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            {t('nav.login')}
          </a>{' '}
          {t('reviews.writeReview')}
        </div>
      )}
    </div>
  );
}

// ─── ReviewCard sub-component with owner reply support ───────────────────

function ReviewCard({
  review,
  isOwner,
  propertyId,
  onReplyChanged,
}: {
  review: Review;
  isOwner: boolean;
  propertyId: string;
  onReplyChanged: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  const [replyError, setReplyError] = useState('');

  const hasReply = !!review.reply;

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setReplying(true);
    setReplyError('');

    try {
      await api.patch(`/properties/${propertyId}/reviews/mine/reply`, {
        reviewId: review.id,
        reply: replyText,
      });
      setShowReplyForm(false);
      setReplyText('');
      onReplyChanged();
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : t('common.sendError'));
    } finally {
      setReplying(false);
    }
  };

  const handleDeleteReply = async () => {
    try {
      await api.delete(
        `/properties/${propertyId}/reviews/mine/reply` as any,
        {
          data: { reviewId: review.id },
        } as any,
      );
      onReplyChanged();
      addToast(t('common.delete'), 'success');
    } catch {
      addToast(t('common.error'), 'error');
    }
  };

  return (
    <div className="pb-5 border-b border-gray-50 last:border-0 last:pb-0">
      {/* Original review */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
            {review.user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{review.user?.name || 'Anonymous'}</p>
            <p className="text-[11px] text-gray-400">
              {new Date(review.createdAt).toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mt-1">{review.comment}</p>

      {/* Owner Reply — nested thread */}
      {hasReply && (
        <div className="mt-3 ml-6 pl-4 border-l-2 border-blue-200 bg-blue-50/50 rounded-r-lg py-3 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <svg
              className="w-3.5 h-3.5 text-blue-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              {t('reviews.reply')}
            </p>
            {review.replyDate && (
              <span className="text-[10px] text-gray-400">
                {new Date(review.replyDate).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{review.reply}</p>
          {isOwner && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  setReplyText(review.reply || '');
                  setShowReplyForm(true);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-100 px-2 py-1 rounded transition-colors"
              >
                {t('common.edit')}
              </button>
              <button
                onClick={handleDeleteReply}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Owner reply form (for reviews without a reply) */}
      {isOwner && !hasReply && !showReplyForm && (
        <button
          onClick={() => setShowReplyForm(true)}
          className="mt-2 ml-6 text-xs text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          {t('reviews.writeReview')}
        </button>
      )}

      {/* Owner reply form (edit or new) */}
      {showReplyForm && isOwner && (
        <form onSubmit={handleSubmitReply} className="mt-3 ml-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              {t('reviews.yourReply')}
            </p>
            <textarea
              required
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder={t('reviews.yourReply')}
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{replyText.length}/1000</p>

            {replyError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2">
                {replyError}
              </p>
            )}

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={replying || !replyText.trim()}
                className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {replying
                  ? t('common.loading')
                  : hasReply
                    ? t('common.save')
                    : t('reviews.submitReview')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                  setReplyError('');
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
