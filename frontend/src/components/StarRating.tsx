import { useState } from 'react'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
  showValue?: boolean
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
}

export default function StarRating({
  rating,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating

  return (
    <div className={`flex items-center gap-0.5 ${showValue ? 'gap-1.5' : ''}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayRating
          const half = !filled && star - 0.5 <= displayRating

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onClick={() => interactive && onChange?.(star)}
              className={`${sizeClasses[size]} ${
                interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-full h-full ${
                  filled
                    ? 'text-yellow-400'
                    : half
                    ? 'text-yellow-400'
                    : 'text-gray-200'
                }`}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-gray-700">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
